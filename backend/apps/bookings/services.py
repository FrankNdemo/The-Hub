from __future__ import annotations

import secrets
from datetime import timedelta

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from apps.notifications.models import Notification

from .delivery import (
    BookingDeliveryError,
    REMINDER_EMAIL_KIND,
    SERVICE_TYPE_LABELS,
    get_booking_time_window,
    build_virtual_session_link,
    send_booking_email,
)
from .exploration import (
    EXPLORATION_CALL_CLIENT_LOCATION_SUMMARY,
    EXPLORATION_CALL_LABEL,
    is_exploration_call,
    is_exploration_call_notes,
)
from .models import Booking, BookingHistoryEvent, BookingPayment, EmailRecord
from .payments import (
    BookingPaymentError,
    initiate_stk_push,
    normalize_mpesa_phone_number,
    parse_callback_metadata,
    query_stk_push_status,
)
from .scheduling import ensure_client_can_book, ensure_slot_is_available

QUERY_FAILURE_CONFIRMATION_GRACE_SECONDS = 25


def make_id(prefix: str) -> str:
    return f"{prefix}-{secrets.token_hex(8)}"


def make_token() -> str:
    return secrets.token_hex(16)[:24]


def create_notification(*, booking: Booking, notification_type: str, title: str, description: str) -> None:
    Notification.objects.create(
        therapist=booking.therapist,
        booking=booking,
        type=notification_type,
        title=title,
        description=description,
    )


def get_booking_fee_amount():
    return settings.BOOKING_FEE_AMOUNT


def get_booking_fee_currency() -> str:
    return settings.BOOKING_FEE_CURRENCY


def get_payment_hold_expiry(now=None):
    current_time = now or timezone.now()
    return current_time + timedelta(minutes=settings.BOOKING_PAYMENT_HOLD_MINUTES)


def validate_booking_request(*, therapist, data: dict, exclude_booking: Booking | None = None) -> None:
    ensure_client_can_book(client_email=data["client_email"], exclude_booking=exclude_booking)
    ensure_slot_is_available(
        therapist=therapist,
        day=data["date"],
        slot_time=data["time"],
        exclude_booking=exclude_booking,
    )


def build_location_summary(*, therapist, session_type: str, exploration_call_request: bool) -> str:
    if session_type == Booking.SessionType.PHYSICAL:
        return therapist.location_summary

    if exploration_call_request:
        return EXPLORATION_CALL_CLIENT_LOCATION_SUMMARY

    return "Online session access will be shared in your calendar-ready confirmation."


def create_booking_record(*, therapist, data: dict, status: str, payment_expires_at=None, confirmed_at=None) -> Booking:
    service_type = data["service_type"]
    exploration_call_request = is_exploration_call_notes(data.get("notes", ""))
    booking = Booking.objects.create(
        manage_token=make_token(),
        client_name=data["client_name"],
        client_email=data["client_email"],
        client_phone=data["client_phone"],
        therapist=therapist,
        therapist_name_snapshot=therapist.name,
        service_type=service_type,
        participant_count=data.get("participant_count") if service_type == Booking.ServiceType.CORPORATE else None,
        session_type=data["session_type"],
        date=data["date"],
        time=data["time"],
        status=status,
        location_summary=build_location_summary(
            therapist=therapist,
            session_type=data["session_type"],
            exploration_call_request=exploration_call_request,
        ),
        calendar_event_id=make_id("booking"),
        meet_link="",
        booking_fee_amount=get_booking_fee_amount(),
        booking_fee_currency=get_booking_fee_currency(),
        payment_expires_at=payment_expires_at,
        confirmed_at=confirmed_at,
        notes=data.get("notes", ""),
    )
    if booking.session_type == Booking.SessionType.VIRTUAL and not is_exploration_call(booking):
        booking.meet_link = build_virtual_session_link(booking)
        booking.save(update_fields=["meet_link", "updated_at"])

    return booking


def get_booking_descriptor(booking: Booking) -> str:
    if is_exploration_call(booking):
        return EXPLORATION_CALL_LABEL.lower()

    return f"{SERVICE_TYPE_LABELS[booking.service_type].lower()} {booking.session_type} session"


def create_booking_confirmation_artifacts(booking: Booking) -> None:
    descriptor = get_booking_descriptor(booking)
    exploration_call = is_exploration_call(booking)
    description = (
        f"{booking.client_name} requested an {descriptor} with {booking.therapist_name_snapshot}."
        if exploration_call
        else (
            f"{booking.client_name} booked a {descriptor} with {booking.therapist_name_snapshot} for {booking.participant_count} participants."
            if booking.service_type == Booking.ServiceType.CORPORATE and booking.participant_count
            else f"{booking.client_name} booked a {descriptor} with {booking.therapist_name_snapshot}."
        )
    )

    BookingHistoryEvent.objects.create(
        booking=booking,
        type=BookingHistoryEvent.EventType.CREATED,
        title="Exploration call requested" if exploration_call else "Booking confirmed",
        description=description,
    )

    send_booking_email(
        booking=booking,
        kind=EmailRecord.EmailKind.CONFIRMATION,
    )

    create_notification(
        booking=booking,
        notification_type=Notification.NotificationType.BOOKING,
        title="New exploration call request" if exploration_call else "New booking confirmed",
        description=(
            f"{booking.client_name} requested an {descriptor} for {booking.date} at {booking.time.strftime('%H:%M')}."
            if exploration_call
            else (
                f"{booking.client_name} booked a {descriptor} for {booking.participant_count} participants on {booking.date} at {booking.time.strftime('%H:%M')}."
                if booking.service_type == Booking.ServiceType.CORPORATE and booking.participant_count
                else f"{booking.client_name} booked a {descriptor} for {booking.date} at {booking.time.strftime('%H:%M')}."
            )
        ),
    )


def get_payment_failure_history_title(payment: BookingPayment) -> str:
    if payment.status == BookingPayment.Status.CANCELLED:
        return "Payment cancelled"
    if payment.status == BookingPayment.Status.TIMED_OUT:
        return "Payment timed out"
    if payment.status == BookingPayment.Status.INSUFFICIENT_FUNDS:
        return "Payment failed due to insufficient funds"
    return "Payment failed"


def get_payment_failure_message(result_code: str, result_description: str) -> tuple[str, str]:
    code = str(result_code).strip()
    description = normalize_payment_result_description(result_description)

    if code == "0":
        return BookingPayment.Status.SUCCESS, description
    if code == "1032":
        return BookingPayment.Status.CANCELLED, "Payment cancelled on the phone."
    if code in {"1037", "1019"}:
        return BookingPayment.Status.TIMED_OUT, "The STK prompt timed out before completion."
    if code == "1":
        return BookingPayment.Status.INSUFFICIENT_FUNDS, "The M-Pesa wallet has insufficient funds."

    return BookingPayment.Status.FAILED, description


def normalize_payment_result_description(result_description: str) -> str:
    description = result_description.strip() or "The payment did not complete."
    lowered_description = description.lower()

    if "initiator" in lowered_description or "credential" in lowered_description:
        return "We could not confirm the M-Pesa request from your phone. Please try again and approve the prompt carefully."

    if "invalid access token" in lowered_description:
        return "We could not finish confirming your M-Pesa request right now. Please try again in a moment."

    return description


def mark_booking_payment_failed(*, booking: Booking, payment: BookingPayment) -> None:
    booking.status = Booking.Status.PAYMENT_FAILED
    booking.payment_expires_at = None
    booking.save(update_fields=["status", "payment_expires_at", "updated_at"])

    BookingHistoryEvent.objects.create(
        booking=booking,
        type=BookingHistoryEvent.EventType.PAYMENT_FAILED,
        title=get_payment_failure_history_title(payment),
        description=payment.result_description or "The booking fee was not completed.",
    )


def finalize_paid_booking(*, booking: Booking, payment: BookingPayment) -> Booking:
    if booking.confirmed_at:
        return booking

    update_fields = ["status", "payment_expires_at", "confirmed_at", "updated_at"]
    booking.status = Booking.Status.UPCOMING
    booking.payment_expires_at = None
    booking.confirmed_at = timezone.now()

    if booking.session_type == Booking.SessionType.VIRTUAL and not booking.meet_link and not is_exploration_call(booking):
        booking.meet_link = build_virtual_session_link(booking)
        update_fields.append("meet_link")

    booking.save(update_fields=update_fields)
    create_booking_confirmation_artifacts(booking)
    return booking


def apply_payment_outcome(
    *,
    booking: Booking,
    payment: BookingPayment,
    result_code: str,
    result_description: str,
    metadata: dict[str, object] | None = None,
    query_payload: dict[str, object] | None = None,
    callback_payload: dict[str, object] | None = None,
) -> tuple[Booking, BookingPayment]:
    if payment.is_final and booking.confirmed_at:
        return booking, payment

    metadata = metadata or {}
    payment_status, normalized_description = get_payment_failure_message(result_code, result_description)
    current_time = timezone.now()

    payment.status = payment_status
    payment.result_code = str(result_code).strip()
    payment.result_description = normalized_description
    payment.completed_at = current_time

    if query_payload is not None:
        payment.query_payload = query_payload
        payment.last_status_check_at = current_time

    if callback_payload is not None:
        payment.callback_payload = callback_payload
        payment.callback_received_at = current_time

    if payment_status == BookingPayment.Status.SUCCESS:
        transaction_id = metadata.get("MpesaReceiptNumber")
        if isinstance(transaction_id, str):
            payment.transaction_id = transaction_id

    payment.save(
        update_fields=[
            "status",
            "result_code",
            "result_description",
            "transaction_id",
            "completed_at",
            "query_payload",
            "callback_payload",
            "callback_received_at",
            "last_status_check_at",
            "updated_at",
        ]
    )

    if payment_status == BookingPayment.Status.SUCCESS:
        booking = finalize_paid_booking(booking=booking, payment=payment)
    else:
        mark_booking_payment_failed(booking=booking, payment=payment)

    return booking, payment


def create_payment_attempt(*, booking: Booking, normalized_phone_number: str) -> BookingPayment:
    return BookingPayment.objects.create(
        booking=booking,
        amount=booking.booking_fee_amount,
        currency=booking.booking_fee_currency,
        phone_number=normalized_phone_number,
        account_reference=booking.manage_token,
        request_payload={
            "amount": float(booking.booking_fee_amount),
            "currency": booking.booking_fee_currency,
            "phoneNumber": normalized_phone_number,
        },
    )


def start_booking_payment(*, booking: Booking, mpesa_phone_number: str) -> tuple[Booking, BookingPayment]:
    normalized_phone_number = normalize_mpesa_phone_number(mpesa_phone_number)
    booking.status = Booking.Status.PAYMENT_PENDING
    booking.payment_expires_at = get_payment_hold_expiry()
    booking.save(update_fields=["status", "payment_expires_at", "updated_at"])

    payment = create_payment_attempt(booking=booking, normalized_phone_number=normalized_phone_number)
    BookingHistoryEvent.objects.create(
        booking=booking,
        type=BookingHistoryEvent.EventType.PAYMENT_INITIATED,
        title="Booking fee checkout started",
        description=f"An M-Pesa STK push was sent to {normalized_phone_number} for {booking.booking_fee_currency} {booking.booking_fee_amount}.",
    )

    try:
        stk_push = initiate_stk_push(booking, normalized_phone_number)
    except BookingPaymentError as exc:
        payment.status = BookingPayment.Status.FAILED
        payment.result_description = exc.detail
        payment.completed_at = timezone.now()
        payment.save(update_fields=["status", "result_description", "completed_at", "updated_at"])
        mark_booking_payment_failed(booking=booking, payment=payment)
        raise

    payment.status = BookingPayment.Status.STK_PUSH_SENT
    payment.merchant_request_id = stk_push.merchant_request_id
    payment.checkout_request_id = stk_push.checkout_request_id
    payment.response_payload = stk_push.raw
    payment.result_description = "STK push sent. Waiting for M-Pesa confirmation."
    payment.save(
        update_fields=[
            "status",
            "merchant_request_id",
            "checkout_request_id",
            "response_payload",
            "result_description",
            "updated_at",
        ]
    )

    return booking, payment


@transaction.atomic
def create_booking(*, therapist, data: dict) -> Booking:
    validate_booking_request(therapist=therapist, data=data)
    booking = create_booking_record(
        therapist=therapist,
        data=data,
        status=Booking.Status.UPCOMING,
        confirmed_at=timezone.now(),
    )
    create_booking_confirmation_artifacts(booking)
    return booking


@transaction.atomic
def create_paid_booking_checkout(*, therapist, data: dict, mpesa_phone_number: str) -> tuple[Booking, BookingPayment]:
    validate_booking_request(therapist=therapist, data=data)

    booking = create_booking_record(
        therapist=therapist,
        data=data,
        status=Booking.Status.PAYMENT_PENDING,
        payment_expires_at=get_payment_hold_expiry(),
    )
    return start_booking_payment(booking=booking, mpesa_phone_number=mpesa_phone_number)


@transaction.atomic
def retry_paid_booking_checkout(*, booking: Booking, mpesa_phone_number: str) -> tuple[Booking, BookingPayment]:
    if is_exploration_call(booking):
        raise ValueError("Exploration call requests do not require M-Pesa checkout.")

    if booking.status in {Booking.Status.CANCELLED, Booking.Status.COMPLETED}:
        raise ValueError("This booking can no longer accept a new payment attempt.")

    if booking.confirmed_at:
        raise ValueError("This booking has already been confirmed.")

    validate_booking_request(
        therapist=booking.therapist,
        data={
            "client_email": booking.client_email,
            "date": booking.date,
            "time": booking.time,
        },
        exclude_booking=booking,
    )

    return start_booking_payment(booking=booking, mpesa_phone_number=mpesa_phone_number)


def should_defer_query_failure_outcome(*, booking: Booking, payment: BookingPayment, result_code: str) -> bool:
    if settings.MPESA_SIMULATE_PAYMENTS:
        return False

    if not result_code or result_code == "0":
        return False

    payment_status, _ = get_payment_failure_message(result_code, "")
    if payment_status in {
        BookingPayment.Status.CANCELLED,
        BookingPayment.Status.TIMED_OUT,
        BookingPayment.Status.INSUFFICIENT_FUNDS,
    }:
        return False

    if booking.confirmed_at or payment.callback_received_at:
        return False

    current_time = timezone.now()
    if booking.payment_expires_at and booking.payment_expires_at <= current_time:
        return False

    return current_time < payment.created_at + timedelta(seconds=QUERY_FAILURE_CONFIRMATION_GRACE_SECONDS)


def sync_booking_payment_status(*, booking: Booking, payment: BookingPayment) -> tuple[Booking, BookingPayment]:
    if payment.is_final:
        return booking, payment

    if booking.payment_expires_at and booking.payment_expires_at <= timezone.now():
        return apply_payment_outcome(
            booking=booking,
            payment=payment,
            result_code="1037",
            result_description="The STK prompt timed out before completion.",
            query_payload={"detail": "Payment hold expired before final confirmation."},
        )

    query_result = query_stk_push_status(payment)

    if not query_result.is_final:
        payment.status = BookingPayment.Status.PROCESSING
        payment.result_description = query_result.result_description
        payment.query_payload = query_result.raw
        payment.last_status_check_at = timezone.now()
        payment.save(update_fields=["status", "result_description", "query_payload", "last_status_check_at", "updated_at"])
        return booking, payment

    if should_defer_query_failure_outcome(
        booking=booking,
        payment=payment,
        result_code=str(query_result.result_code).strip(),
    ):
        payment.status = BookingPayment.Status.PROCESSING
        payment.result_description = (
            "We have received your M-Pesa response and are waiting for final confirmation before updating your booking."
        )
        payment.query_payload = query_result.raw
        payment.last_status_check_at = timezone.now()
        payment.save(update_fields=["status", "result_description", "query_payload", "last_status_check_at", "updated_at"])
        return booking, payment

    return apply_payment_outcome(
        booking=booking,
        payment=payment,
        result_code=query_result.result_code,
        result_description=query_result.result_description,
        metadata=query_result.metadata,
        query_payload=query_result.raw,
    )


@transaction.atomic
def handle_mpesa_callback(*, checkout_request_id: str, payload: dict[str, object]) -> tuple[Booking, BookingPayment] | None:
    if not checkout_request_id:
        return None

    payment = (
        BookingPayment.objects.select_related("booking", "booking__therapist")
        .filter(checkout_request_id=checkout_request_id)
        .first()
    )
    if not payment:
        return None

    booking = payment.booking
    callback = payload.get("Body", {}).get("stkCallback", {}) if isinstance(payload.get("Body"), dict) else {}
    result_code = str(callback.get("ResultCode", "")).strip()
    result_description = str(callback.get("ResultDesc", "")).strip()
    metadata = parse_callback_metadata(payload)

    return apply_payment_outcome(
        booking=booking,
        payment=payment,
        result_code=result_code,
        result_description=result_description,
        metadata=metadata,
        callback_payload=payload,
    )


@transaction.atomic
def reschedule_booking(*, booking: Booking, date, time) -> Booking:
    if booking.status == Booking.Status.CANCELLED:
        raise ValueError("Cancelled bookings cannot be rescheduled.")

    ensure_slot_is_available(
        therapist=booking.therapist,
        day=date,
        slot_time=time,
        exclude_booking=booking,
    )

    booking.date = date
    booking.time = time
    booking.status = Booking.Status.RESCHEDULED
    if booking.session_type == Booking.SessionType.VIRTUAL and not is_exploration_call(booking):
        booking.meet_link = build_virtual_session_link(booking)
    elif is_exploration_call(booking):
        booking.meet_link = ""
    booking.save()

    BookingHistoryEvent.objects.create(
        booking=booking,
        type=BookingHistoryEvent.EventType.RESCHEDULED,
        title="Exploration call request updated" if is_exploration_call(booking) else "Session rescheduled",
        description=(
            f"{booking.client_name} moved the exploration call request to {booking.date} at {booking.time.strftime('%H:%M')}."
            if is_exploration_call(booking)
            else f"{booking.client_name} moved the session to {booking.date} at {booking.time.strftime('%H:%M')}."
        ),
    )

    send_booking_email(
        booking=booking,
        kind=EmailRecord.EmailKind.RESCHEDULE,
    )
    create_notification(
        booking=booking,
        notification_type=Notification.NotificationType.RESCHEDULE,
        title="Exploration call request updated" if is_exploration_call(booking) else "Session rescheduled",
        description=(
            f"{booking.client_name} updated the exploration call request to {booking.date} at {booking.time.strftime('%H:%M')}."
            if is_exploration_call(booking)
            else f"{booking.client_name} selected {booking.date} at {booking.time.strftime('%H:%M')}."
        ),
    )

    return booking


@transaction.atomic
def cancel_booking(*, booking: Booking) -> Booking:
    if booking.status == Booking.Status.CANCELLED:
        raise ValueError("Booking is already cancelled.")

    booking.status = Booking.Status.CANCELLED
    booking.save(update_fields=["status", "updated_at"])

    BookingHistoryEvent.objects.create(
        booking=booking,
        type=BookingHistoryEvent.EventType.CANCELLED,
        title="Exploration call request cancelled" if is_exploration_call(booking) else "Session cancelled",
        description=(
            f"{booking.client_name} cancelled the exploration call request scheduled for {booking.date}."
            if is_exploration_call(booking)
            else f"{booking.client_name} cancelled the session scheduled for {booking.date}."
        ),
    )

    send_booking_email(
        booking=booking,
        kind=EmailRecord.EmailKind.CANCELLATION,
    )
    create_notification(
        booking=booking,
        notification_type=Notification.NotificationType.CANCEL,
        title="Exploration call request cancelled" if is_exploration_call(booking) else "Session cancelled",
        description=(
            f"{booking.client_name} cancelled an exploration call request."
            if is_exploration_call(booking)
            else f"{booking.client_name} cancelled a {booking.session_type} session."
        ),
    )
    return booking


def send_upcoming_session_reminders(now=None) -> dict[str, int]:
    current_time = now or timezone.now()
    lead_window_end = current_time + timedelta(minutes=settings.BOOKING_REMINDER_LEAD_MINUTES)
    local_start_date = timezone.localtime(current_time).date()
    local_end_date = timezone.localtime(lead_window_end).date()
    sent_count = 0
    failed_count = 0

    bookings = (
        Booking.objects.filter(
            deleted_at__isnull=True,
            status__in=[Booking.Status.UPCOMING, Booking.Status.RESCHEDULED],
            date__range=(local_start_date, local_end_date),
        )
        .select_related("therapist")
        .exclude(emails__kind=REMINDER_EMAIL_KIND)
        .distinct()
    )

    for booking in bookings:
        if is_exploration_call(booking):
            continue

        start_at, _ = get_booking_time_window(booking)

        if start_at < current_time or start_at > lead_window_end:
            continue

        try:
            send_booking_email(
                booking=booking,
                kind=REMINDER_EMAIL_KIND,
            )
            sent_count += 1
        except BookingDeliveryError:
            failed_count += 1

    return {"sent": sent_count, "failed": failed_count}


@transaction.atomic
def complete_booking(*, booking: Booking) -> Booking:
    if booking.status in {Booking.Status.CANCELLED, Booking.Status.COMPLETED}:
        raise ValueError("Booking cannot be marked completed.")

    booking.status = Booking.Status.COMPLETED
    booking.save(update_fields=["status", "updated_at"])

    BookingHistoryEvent.objects.create(
        booking=booking,
        type=BookingHistoryEvent.EventType.COMPLETED,
        title="Session completed",
        description=f"{booking.client_name}'s session was marked as completed.",
    )
    create_notification(
        booking=booking,
        notification_type=Notification.NotificationType.COMPLETION,
        title="Session completed",
        description=f"{booking.client_name}'s session with {booking.therapist_name_snapshot} is now complete.",
    )
    return booking


@transaction.atomic
def delete_booking(*, booking: Booking, reason: str) -> None:
    if booking.is_deleted:
        raise ValueError("Booking has already been removed.")

    booking.status = Booking.Status.CANCELLED
    booking.mark_deleted(reason=reason)
    booking.save(update_fields=["status", "deleted_at", "deleted_reason", "updated_at"])

    BookingHistoryEvent.objects.create(
        booking=booking,
        type=BookingHistoryEvent.EventType.CANCELLED,
        title="Session deleted by therapist",
        description=f"{booking.therapist_name_snapshot} removed this session from the dashboard. Reason: {reason.strip()}",
    )
