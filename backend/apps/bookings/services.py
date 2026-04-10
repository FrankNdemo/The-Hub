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
from .models import Booking, BookingHistoryEvent, EmailRecord
from .scheduling import ensure_client_can_book, ensure_slot_is_available


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


@transaction.atomic
def create_booking(*, therapist, data: dict) -> Booking:
    ensure_client_can_book(client_email=data["client_email"])
    ensure_slot_is_available(
        therapist=therapist,
        day=data["date"],
        slot_time=data["time"],
    )
    service_type = data["service_type"]
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
        status=Booking.Status.UPCOMING,
        location_summary=(
            therapist.location_summary
            if data["session_type"] == Booking.SessionType.PHYSICAL
            else "Online session access will be shared in your calendar-ready confirmation."
        ),
        calendar_event_id=make_id("booking"),
        meet_link="",
        notes=data.get("notes", ""),
    )
    if booking.session_type == Booking.SessionType.VIRTUAL:
        booking.meet_link = build_virtual_session_link(booking)
        booking.save(update_fields=["meet_link", "updated_at"])

    descriptor = f"{SERVICE_TYPE_LABELS[booking.service_type].lower()} {booking.session_type} session"
    description = (
        f"{booking.client_name} booked a {descriptor} with {therapist.name} for {booking.participant_count} participants."
        if booking.service_type == Booking.ServiceType.CORPORATE and booking.participant_count
        else f"{booking.client_name} booked a {descriptor} with {therapist.name}."
    )
    BookingHistoryEvent.objects.create(
        booking=booking,
        type=BookingHistoryEvent.EventType.CREATED,
        title="Booking confirmed",
        description=description,
    )

    send_booking_email(
        booking=booking,
        kind=EmailRecord.EmailKind.CONFIRMATION,
    )

    create_notification(
        booking=booking,
        notification_type=Notification.NotificationType.BOOKING,
        title="New booking confirmed",
        description=(
            f"{booking.client_name} booked a {descriptor} for {booking.participant_count} participants on {booking.date} at {booking.time.strftime('%H:%M')}."
            if booking.service_type == Booking.ServiceType.CORPORATE and booking.participant_count
            else f"{booking.client_name} booked a {descriptor} for {booking.date} at {booking.time.strftime('%H:%M')}."
        ),
    )

    return booking


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
    if booking.session_type == Booking.SessionType.VIRTUAL:
        booking.meet_link = build_virtual_session_link(booking)
    booking.save()

    BookingHistoryEvent.objects.create(
        booking=booking,
        type=BookingHistoryEvent.EventType.RESCHEDULED,
        title="Session rescheduled",
        description=f"{booking.client_name} moved the session to {booking.date} at {booking.time.strftime('%H:%M')}.",
    )

    send_booking_email(
        booking=booking,
        kind=EmailRecord.EmailKind.RESCHEDULE,
    )
    create_notification(
        booking=booking,
        notification_type=Notification.NotificationType.RESCHEDULE,
        title="Session rescheduled",
        description=f"{booking.client_name} selected {booking.date} at {booking.time.strftime('%H:%M')}.",
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
        title="Session cancelled",
        description=f"{booking.client_name} cancelled the session scheduled for {booking.date}.",
    )

    send_booking_email(
        booking=booking,
        kind=EmailRecord.EmailKind.CANCELLATION,
    )
    create_notification(
        booking=booking,
        notification_type=Notification.NotificationType.CANCEL,
        title="Session cancelled",
        description=f"{booking.client_name} cancelled a {booking.session_type} session.",
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
