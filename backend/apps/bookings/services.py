from __future__ import annotations

import secrets
import string

from django.conf import settings
from django.db import transaction

from apps.notifications.models import Notification

from .models import Booking, BookingHistoryEvent, EmailRecord


SERVICE_TYPE_LABELS = {
    Booking.ServiceType.INDIVIDUAL: "Individual Therapy",
    Booking.ServiceType.FAMILY: "Family Therapy",
    Booking.ServiceType.CORPORATE: "Corporate Wellness",
}


def build_manage_url(token: str) -> str:
    return f"{settings.FRONTEND_BASE_URL}/manage/{token}"


def make_id(prefix: str) -> str:
    return f"{prefix}-{secrets.token_hex(8)}"


def make_token() -> str:
    return secrets.token_hex(16)[:24]


def make_meet_link() -> str:
    alphabet = string.ascii_lowercase

    def chunk() -> str:
        return "".join(secrets.choice(alphabet) for _ in range(3))

    return f"https://meet.google.com/{chunk()}-{chunk()}-{chunk()}"


def format_display_time(value) -> str:
    return value.strftime("%I:%M %p").lstrip("0")


def format_display_date(value) -> str:
    return value.strftime("%B %-d, %Y") if hasattr(value, "strftime") else str(value)


def build_email_html(booking: Booking, kind: str) -> str:
    heading_map = {
        EmailRecord.EmailKind.CONFIRMATION: "Your session is confirmed",
        EmailRecord.EmailKind.RESCHEDULE: "Your session has been rescheduled",
        EmailRecord.EmailKind.CANCELLATION: "Your session has been cancelled",
    }

    intro_map = {
        EmailRecord.EmailKind.CONFIRMATION: (
            "Thank you for booking with The Wellness Hub. Here is your session summary and your private booking management link."
        ),
        EmailRecord.EmailKind.RESCHEDULE: (
            "Your updated session details are below. Your private management link remains active if you need to make another change."
        ),
        EmailRecord.EmailKind.CANCELLATION: (
            "This message confirms that your session has been cancelled. If you would like to book again, we would be honored to support you."
        ),
    }

    session_location = booking.meet_link or "Google Meet link will be shared shortly." if booking.session_type == Booking.SessionType.VIRTUAL else booking.location_summary
    participant_details = (
        f"""
              <tr>
                <td style="width:180px;font-size:13px;color:#6f8f82;text-transform:uppercase;letter-spacing:0.12em;">Participants</td>
                <td style="font-size:15px;color:#23483d;">{booking.participant_count}</td>
              </tr>"""
        if booking.service_type == Booking.ServiceType.CORPORATE and booking.participant_count
        else ""
    )

    return f"""<!DOCTYPE html>
  <html lang="en">
    <body style="margin:0;padding:24px;background:#f5f3ec;font-family:Inter,Arial,sans-serif;color:#23483d;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid rgba(35,72,61,0.08);">
        <tr>
          <td style="padding:28px 32px;background:linear-gradient(135deg,#edf4ef,#f9f7f0);">
            <p style="margin:0 0 10px;font-size:12px;letter-spacing:0.35em;text-transform:uppercase;color:#6f8f82;">The Wellness Hub</p>
            <h1 style="margin:0;font-size:30px;line-height:1.2;color:#23483d;">{heading_map[kind]}</h1>
            <p style="margin:14px 0 0;font-size:15px;line-height:1.7;color:#4c695f;">{intro_map[kind]}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0 12px;">
              <tr>
                <td style="width:180px;font-size:13px;color:#6f8f82;text-transform:uppercase;letter-spacing:0.12em;">Client</td>
                <td style="font-size:15px;color:#23483d;">{booking.client_name}</td>
              </tr>
              <tr>
                <td style="width:180px;font-size:13px;color:#6f8f82;text-transform:uppercase;letter-spacing:0.12em;">Therapist</td>
                <td style="font-size:15px;color:#23483d;">{booking.therapist_name_snapshot}</td>
              </tr>
              <tr>
                <td style="width:180px;font-size:13px;color:#6f8f82;text-transform:uppercase;letter-spacing:0.12em;">Date</td>
                <td style="font-size:15px;color:#23483d;">{booking.date.strftime("%B %d, %Y")}</td>
              </tr>
              <tr>
                <td style="width:180px;font-size:13px;color:#6f8f82;text-transform:uppercase;letter-spacing:0.12em;">Time</td>
                <td style="font-size:15px;color:#23483d;">{booking.time.strftime("%I:%M %p").lstrip("0")}</td>
              </tr>
              <tr>
                <td style="width:180px;font-size:13px;color:#6f8f82;text-transform:uppercase;letter-spacing:0.12em;">Session Type</td>
                <td style="font-size:15px;color:#23483d;text-transform:capitalize;">{booking.session_type}</td>
              </tr>
              <tr>
                <td style="width:180px;font-size:13px;color:#6f8f82;text-transform:uppercase;letter-spacing:0.12em;">Service Type</td>
                <td style="font-size:15px;color:#23483d;">{SERVICE_TYPE_LABELS[booking.service_type]}</td>
              </tr>
              {participant_details}
              <tr>
                <td style="width:180px;font-size:13px;color:#6f8f82;text-transform:uppercase;letter-spacing:0.12em;">Details</td>
                <td style="font-size:15px;color:#23483d;line-height:1.6;">{session_location}</td>
              </tr>
            </table>
            <div style="margin-top:28px;padding:24px;border-radius:20px;background:#f7fbf8;border:1px solid rgba(35,72,61,0.08);">
              <p style="margin:0 0 8px;font-size:13px;color:#6f8f82;text-transform:uppercase;letter-spacing:0.12em;">Manage Your Session</p>
              <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#4c695f;">Use your private link below to reschedule or cancel your session without logging in.</p>
              <a href="{build_manage_url(booking.manage_token)}" style="display:inline-block;padding:13px 20px;border-radius:999px;background:#4e7c68;color:#ffffff;text-decoration:none;font-weight:600;">Reschedule or Cancel</a>
            </div>
          </td>
        </tr>
      </table>
    </body>
  </html>"""


def create_notification(*, booking: Booking, notification_type: str, title: str, description: str) -> None:
    Notification.objects.create(
        therapist=booking.therapist,
        booking=booking,
        type=notification_type,
        title=title,
        description=description,
    )


def create_email_record(*, booking: Booking, kind: str, subject: str) -> EmailRecord:
    return EmailRecord.objects.create(
        booking=booking,
        kind=kind,
        subject=subject,
        recipients=[booking.client_email, booking.therapist.email],
        html=build_email_html(booking, kind),
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
        calendar_event_id=make_id("gcal"),
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

    create_email_record(
        booking=booking,
        kind=EmailRecord.EmailKind.CONFIRMATION,
        subject="Session Confirmation | The Wellness Hub",
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

    create_email_record(
        booking=booking,
        kind=EmailRecord.EmailKind.RESCHEDULE,
        subject="Session Rescheduled | The Wellness Hub",
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

    create_email_record(
        booking=booking,
        kind=EmailRecord.EmailKind.CANCELLATION,
        subject="Session Cancelled | The Wellness Hub",
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
