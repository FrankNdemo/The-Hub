from __future__ import annotations

import secrets
import string

from django.db import transaction

from apps.notifications.models import Notification

from .delivery import (
    BookingDeliveryError,
    SERVICE_TYPE_LABELS,
    send_booking_email,
)
from .models import Booking, BookingHistoryEvent, EmailRecord


def make_id(prefix: str) -> str:
    return f"{prefix}-{secrets.token_hex(8)}"


def make_token() -> str:
    return secrets.token_hex(16)[:24]


def make_meet_link() -> str:
    alphabet = string.ascii_lowercase

    def chunk() -> str:
        return "".join(secrets.choice(alphabet) for _ in range(3))

    return f"https://meet.google.com/{chunk()}-{chunk()}-{chunk()}"


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
        location_summary=therapist.location_summary if data["session_type"] == Booking.SessionType.PHYSICAL else "Online via Google Meet",
        calendar_event_id=make_id("booking"),
        meet_link=make_meet_link() if data["session_type"] == Booking.SessionType.VIRTUAL else "",
        notes=data.get("notes", ""),
    )

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

    booking.date = date
    booking.time = time
    booking.status = Booking.Status.RESCHEDULED
    if booking.session_type == Booking.SessionType.VIRTUAL:
        booking.meet_link = make_meet_link()
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
