from __future__ import annotations

import base64
import hashlib
import html
import json
import re
from datetime import datetime, timedelta, timezone as dt_timezone
from email.utils import parseaddr
from urllib import error as urllib_error
from urllib import request as urllib_request
from urllib.parse import urlencode
from zoneinfo import ZoneInfo

from django.conf import settings
from django.core.mail import EmailMultiAlternatives, get_connection
from django.utils import timezone

from .models import Booking, BookingHistoryEvent, EmailRecord


SERVICE_TYPE_LABELS = {
    Booking.ServiceType.INDIVIDUAL: "Individual Therapy",
    Booking.ServiceType.FAMILY: "Family Therapy",
    Booking.ServiceType.CORPORATE: "Corporate Wellness",
}
CLIENT_AUDIENCE = "client"
THERAPIST_AUDIENCE = "therapist"
REMINDER_EMAIL_KIND = "reminder"
SESSION_QUOTES = (
    "Healing often begins when someone feels seen, safe, and heard.",
    "Small steady steps can become life-changing progress.",
    "A protected hour for your wellbeing can change the rest of your week.",
    "Gentle consistency creates space for deep growth.",
    "Courage is often quiet, and it still counts.",
)


class BookingDeliveryError(Exception):
    """Raised when a booking email or calendar invite cannot be delivered."""


def build_manage_url(token: str) -> str:
    return f"{settings.FRONTEND_BASE_URL}/manage/{token}"


def build_join_url(token: str) -> str:
    return f"{settings.FRONTEND_BASE_URL}/join/{token}"


def build_therapist_dashboard_url() -> str:
    return f"{settings.FRONTEND_BASE_URL}/therapist/portal"


def get_booking_session_title(booking: Booking) -> str:
    session_mode = "Virtual Session" if booking.session_type == Booking.SessionType.VIRTUAL else "In-Person Session"
    return f"{SERVICE_TYPE_LABELS[booking.service_type]} {session_mode}"


def get_virtual_session_title(booking: Booking) -> str:
    return f"The Wellness Hub Virtual Session | {get_booking_quote(booking)}"


def get_booking_quote(booking: Booking) -> str:
    seed = booking.calendar_event_id or booking.manage_token or str(booking.pk)
    digest = hashlib.sha256(seed.encode("utf-8")).hexdigest()
    index = int(digest[:8], 16) % len(SESSION_QUOTES)
    return SESSION_QUOTES[index]


def format_display_time(value) -> str:
    return value.strftime("%I:%M %p").lstrip("0")


def format_display_date(value) -> str:
    if not hasattr(value, "strftime"):
        return str(value)

    return value.strftime("%B %d, %Y").replace(" 0", " ")


def escape_html(value: str) -> str:
    return html.escape(value, quote=True)


def escape_html_with_breaks(value: str) -> str:
    return escape_html(value).replace("\r\n", "\n").replace("\n", "<br />")


def build_email_detail_card(label: str, value: str, href: str = "", link_label: str = "") -> str:
    if href and link_label:
        value_markup = f"""
                              <a href="{escape_html(href)}" style="display:inline-block;font-size:16px;line-height:24px;font-weight:700;color:#23483d;text-decoration:none;border-bottom:1px solid #4e7c68;">
                                {escape_html(link_label)}
                              </a>
                              <div style="margin-top:6px;font-size:13px;line-height:20px;color:#6f8f82;">
                                {escape_html(value)}
                              </div>"""
    else:
        value_markup = escape_html_with_breaks(value)

    return f"""
                    <tr>
                      <td style="padding:0 0 12px;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:separate;border-spacing:0;background-color:#f7fbf8;border:1px solid #dfe9e3;border-radius:18px;table-layout:fixed;">
                          <tr>
                            <td style="padding:14px 18px 6px;font-size:11px;line-height:16px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:#6f8f82;">
                              {escape_html(label)}
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:0 18px 16px;font-size:16px;line-height:24px;color:#23483d;word-break:break-word;word-wrap:break-word;overflow-wrap:anywhere;">
                              {value_markup}
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>"""


def get_session_location(booking: Booking) -> str:
    if booking.session_type == Booking.SessionType.VIRTUAL:
        return build_join_url(booking.manage_token)

    return booking.location_summary


def build_virtual_session_link(booking: Booking) -> str:
    room_seed = booking.manage_token or booking.calendar_event_id or str(booking.pk)
    room_name = re.sub(r"[^a-zA-Z0-9-]+", "-", f"{settings.VIRTUAL_SESSION_ROOM_PREFIX}-{room_seed}").strip("-")
    return f"{settings.VIRTUAL_SESSION_BASE_URL}/{room_name.lower()}"


def build_google_calendar_add_url(booking: Booking, audience: str = CLIENT_AUDIENCE) -> str:
    start_at, end_at = get_booking_time_window(booking)
    title = (
        f"{booking.client_name} | {get_booking_session_title(booking)}"
        if audience == THERAPIST_AUDIENCE
        else f"The Wellness Hub Session with {booking.therapist_name_snapshot}"
    )
    access_label = "Join Link" if booking.session_type == Booking.SessionType.VIRTUAL else "Location"
    access_value = get_session_location(booking)
    detail_lines = [
        f"Therapist: {booking.therapist_name_snapshot}",
        f"Service: {SERVICE_TYPE_LABELS[booking.service_type]}",
        f"Session starts: {format_display_date(booking.date)} at {format_display_time(booking.time)}",
        f"{access_label}: {access_value}",
        f"Reflection: {get_booking_quote(booking)}",
    ]

    if audience == CLIENT_AUDIENCE:
        detail_lines.append(f"Manage or reschedule privately: {build_manage_url(booking.manage_token)}")
    else:
        detail_lines.append("You may adjust the calendar title before saving this therapist copy.")

    details = "\n".join(detail_lines)
    query = urlencode(
        {
            "action": "TEMPLATE",
            "text": title,
            "dates": (
                f"{start_at.astimezone(dt_timezone.utc).strftime('%Y%m%dT%H%M%SZ')}/"
                f"{end_at.astimezone(dt_timezone.utc).strftime('%Y%m%dT%H%M%SZ')}"
            ),
            "details": details,
            "location": access_value,
        }
    )
    return f"https://calendar.google.com/calendar/render?{query}"


def get_email_subject(kind: str, audience: str) -> str:
    subject_map = {
        EmailRecord.EmailKind.CONFIRMATION: {
            CLIENT_AUDIENCE: "Your Session Is Confirmed | The Wellness Hub",
            THERAPIST_AUDIENCE: "New Session Booked | The Wellness Hub",
        },
        EmailRecord.EmailKind.RESCHEDULE: {
            CLIENT_AUDIENCE: "Your Session Has Been Rescheduled | The Wellness Hub",
            THERAPIST_AUDIENCE: "Session Rescheduled | The Wellness Hub",
        },
        EmailRecord.EmailKind.CANCELLATION: {
            CLIENT_AUDIENCE: "Your Session Has Been Cancelled | The Wellness Hub",
            THERAPIST_AUDIENCE: "Session Cancellation Notice | The Wellness Hub",
        },
        REMINDER_EMAIL_KIND: {
            CLIENT_AUDIENCE: "Your Session Is Almost Here | The Wellness Hub",
            THERAPIST_AUDIENCE: "Upcoming Session Reminder | The Wellness Hub",
        },
    }
    return subject_map[kind][audience]


def get_email_heading(kind: str, audience: str) -> str:
    heading_map = {
        EmailRecord.EmailKind.CONFIRMATION: {
            CLIENT_AUDIENCE: "Your session is confirmed",
            THERAPIST_AUDIENCE: "You have a new session booking",
        },
        EmailRecord.EmailKind.RESCHEDULE: {
            CLIENT_AUDIENCE: "Your session has been rescheduled",
            THERAPIST_AUDIENCE: "A session has been rescheduled",
        },
        EmailRecord.EmailKind.CANCELLATION: {
            CLIENT_AUDIENCE: "Your session has been cancelled",
            THERAPIST_AUDIENCE: "A session has been cancelled",
        },
        REMINDER_EMAIL_KIND: {
            CLIENT_AUDIENCE: "Your session is almost here",
            THERAPIST_AUDIENCE: "Your next session is coming up",
        },
    }
    return heading_map[kind][audience]


def get_email_intro(booking: Booking, kind: str, audience: str) -> str:
    if audience == CLIENT_AUDIENCE:
        intro_map = {
            EmailRecord.EmailKind.CONFIRMATION: (
                f"Thank you for booking with The Wellness Hub. Your session with {booking.therapist_name_snapshot} is ready, and the attached calendar invite will help you keep the appointment on track."
            ),
            EmailRecord.EmailKind.RESCHEDULE: (
                f"Your session with {booking.therapist_name_snapshot} has been updated. The attached calendar invite will refresh the saved event in your calendar."
            ),
            EmailRecord.EmailKind.CANCELLATION: (
                "This message confirms that your session has been cancelled. The attached calendar update lets your calendar remove or mark the event correctly."
            ),
            REMINDER_EMAIL_KIND: (
                f"Your session with {booking.therapist_name_snapshot} is almost here. Keep this email close, and use the private session link when it is time."
            ),
        }
        return intro_map[kind]

    intro_map = {
        EmailRecord.EmailKind.CONFIRMATION: (
            f"Hello {booking.therapist_name_snapshot}, a new {booking.session_type} {SERVICE_TYPE_LABELS[booking.service_type].lower()} session has been booked. The client details, session link, and attached calendar invite are below."
        ),
        EmailRecord.EmailKind.RESCHEDULE: (
            f"Hello {booking.therapist_name_snapshot}, a client has rescheduled an upcoming session. The refreshed session details and calendar invite are below."
        ),
        EmailRecord.EmailKind.CANCELLATION: (
            f"Hello {booking.therapist_name_snapshot}, a client has cancelled a scheduled session. The updated calendar notice is attached so your calendar can stay in sync."
        ),
        REMINDER_EMAIL_KIND: (
            f"Hello {booking.therapist_name_snapshot}, your upcoming {booking.session_type} {SERVICE_TYPE_LABELS[booking.service_type].lower()} session is almost here. The client details, session link, and calendar reminder are below."
        ),
    }
    return intro_map[kind]


def get_summary_card_values(booking: Booking, audience: str) -> list[tuple[str, str, str, str]]:
    cards: list[tuple[str, str, str, str]]

    if audience == CLIENT_AUDIENCE:
        cards = [
            ("Therapist", booking.therapist_name_snapshot, "", ""),
            ("Date", format_display_date(booking.date), "", ""),
            ("Time", format_display_time(booking.time), "", ""),
            ("Session Type", booking.session_type.capitalize(), "", ""),
            ("Service Type", SERVICE_TYPE_LABELS[booking.service_type], "", ""),
        ]
    else:
        cards = [
            ("Client", booking.client_name, "", ""),
            ("Client Email", booking.client_email, "", ""),
            ("Client Phone", booking.client_phone, "", ""),
            ("Date", format_display_date(booking.date), "", ""),
            ("Time", format_display_time(booking.time), "", ""),
            ("Session Type", booking.session_type.capitalize(), "", ""),
            ("Service Type", SERVICE_TYPE_LABELS[booking.service_type], "", ""),
        ]

    if booking.service_type == Booking.ServiceType.CORPORATE and booking.participant_count:
        cards.append(("Participants", str(booking.participant_count), "", ""))

    cards.append(
        (
            "Calendar",
            "Adds the appointment with timing and the private join link.",
            build_google_calendar_add_url(booking, audience),
            "Add to Google Calendar",
        )
    )

    if booking.session_type == Booking.SessionType.VIRTUAL and booking.meet_link:
        cards.append(
            (
                "Virtual Session Link",
                "The room will be available on the session day. Keep in touch with your email for updates; there is no need to worry.",
                build_join_url(booking.manage_token),
                "Join Virtual Session",
            )
        )
    else:
        cards.append(("Location", booking.location_summary, "", ""))

    if booking.notes:
        cards.append(("Notes", booking.notes, "", ""))

    cards.append(("Session Reflection", get_booking_quote(booking), "", ""))

    return cards


def get_email_cta(booking: Booking, audience: str) -> tuple[str, str, str, str]:
    if audience == CLIENT_AUDIENCE:
        return (
            "Manage Your Session",
            "Use your private link below to reschedule or cancel your session. Your attached calendar invite will keep reflecting the latest booking changes.",
            "Reschedule or Cancel",
            build_manage_url(booking.manage_token),
        )

    return (
        "Therapist Portal",
        "Add the attached invite or Google Calendar link to your calendar. Open the therapist portal any time you want to review the session alongside your dashboard updates.",
        "Open Therapist Portal",
        build_therapist_dashboard_url(),
    )


def build_email_html(booking: Booking, kind: str, audience: str) -> str:
    heading = get_email_heading(kind, audience)
    intro = get_email_intro(booking, kind, audience)
    summary_cards = [
        build_email_detail_card(label, value, href, link_label)
        for label, value, href, link_label in get_summary_card_values(booking, audience)
    ]
    cta_title, cta_text, cta_label, cta_url = get_email_cta(booking, audience)

    return f"""<!DOCTYPE html>
  <html lang="en" xmlns="http://www.w3.org/1999/xhtml">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <title>{escape_html(heading)}</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f5f3ec;font-family:'Segoe UI',Arial,sans-serif;color:#23483d;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;margin:0;padding:0;background-color:#f5f3ec;">
        <tr>
          <td align="center" style="padding:24px 12px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" align="center" style="width:100%;max-width:600px;margin:0 auto;border-collapse:collapse;table-layout:fixed;">
              <tr>
                <td style="background-color:#ffffff;border:1px solid #dfe9e3;border-radius:26px;overflow:hidden;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;">
                    <tr>
                      <td align="center" style="padding:32px 24px 24px;background-color:#edf4ef;border-bottom:1px solid #dfe9e3;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto 12px;">
                          <tr>
                            <td align="center">
                              <p style="margin:0;font-size:10px;line-height:14px;font-weight:700;letter-spacing:0.38em;text-transform:uppercase;color:#6f8f82;">
                                THE
                              </p>
                              <p style="margin:2px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:32px;font-style:italic;font-weight:700;color:#23483d;">
                                Wellness
                              </p>
                              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:18px;line-height:20px;font-style:italic;font-weight:700;color:#23483d;">
                                Hub
                              </p>
                            </td>
                          </tr>
                        </table>
                        <h1 style="margin:0;font-size:34px;line-height:42px;font-weight:700;color:#23483d;">
                          {escape_html(heading)}
                        </h1>
                        <p style="margin:16px auto 0;max-width:460px;font-size:16px;line-height:28px;color:#4c695f;">
                          {escape_html(intro)}
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:24px 18px 12px;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;">
                          {''.join(summary_cards)}
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:4px 18px 24px;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:separate;border-spacing:0;background-color:#f7fbf8;border:1px solid #dfe9e3;border-radius:20px;">
                          <tr>
                            <td align="center" style="padding:24px 20px;">
                              <p style="margin:0 0 8px;font-size:12px;line-height:18px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#6f8f82;">
                                {escape_html(cta_title)}
                              </p>
                              <p style="margin:0 auto 18px;max-width:420px;font-size:15px;line-height:26px;color:#4c695f;">
                                {escape_html(cta_text)}
                              </p>
                              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto 14px;">
                                <tr>
                                  <td align="center" bgcolor="#4e7c68" style="border-radius:999px;">
                                    <a href="{escape_html(cta_url)}" style="display:inline-block;padding:14px 24px;font-size:15px;font-weight:600;line-height:20px;color:#ffffff;text-decoration:none;">
                                      {escape_html(cta_label)}
                                    </a>
                                  </td>
                                </tr>
                              </table>
                              <p style="margin:0;font-size:13px;line-height:22px;color:#6f8f82;">
                                <a href="{escape_html(cta_url)}" style="color:#6f8f82;text-decoration:none;border-bottom:1px solid #adc3b8;">
                                  Open private booking link
                                </a>
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>"""


def build_email_text(booking: Booking, kind: str, audience: str) -> str:
    heading = get_email_heading(kind, audience)
    intro = get_email_intro(booking, kind, audience)
    cta_title, _, cta_label, _ = get_email_cta(booking, audience)
    summary_lines = [
        "The Wellness Hub",
        "",
        heading,
        "",
        intro,
        "",
    ]

    for label, value, href, link_label in get_summary_card_values(booking, audience):
        summary_lines.append(f"{label}: {link_label if href and link_label else value}")

    summary_lines.extend(
        [
            "",
            "Calendar Invite: Add the attached invite to your calendar to receive reminders and session access details.",
            f"{cta_title}: {cta_label}",
        ]
    )

    return "\n".join(summary_lines)


def fold_ical_line(value: str) -> str:
    if len(value) <= 73:
        return value

    parts: list[str] = []
    remainder = value
    while remainder:
        parts.append(remainder[:73])
        remainder = remainder[73:]
        if remainder:
            remainder = f" {remainder}"

    return "\r\n".join(parts)


def escape_ical_text(value: str) -> str:
    return (
        value.replace("\\", "\\\\")
        .replace("\r\n", "\\n")
        .replace("\n", "\\n")
        .replace(";", r"\;")
        .replace(",", r"\,")
    )


def get_calendar_uid(booking: Booking) -> str:
    if "@" in booking.calendar_event_id:
        return booking.calendar_event_id

    return f"{booking.calendar_event_id}@{settings.BOOKING_CALENDAR_UID_DOMAIN}"


def get_calendar_sequence(booking: Booking) -> int:
    return max(0, BookingHistoryEvent.objects.filter(booking=booking).count() - 1)


def get_booking_time_window(booking: Booking) -> tuple[datetime, datetime]:
    tz = ZoneInfo(settings.TIME_ZONE)
    start_at = datetime.combine(booking.date, booking.time).replace(tzinfo=tz)
    end_at = start_at + timedelta(minutes=settings.BOOKING_DURATION_MINUTES)
    return start_at, end_at


def get_organizer_email(booking: Booking) -> str:
    _, parsed = parseaddr(settings.DEFAULT_FROM_EMAIL)
    return parsed or booking.therapist.email


def build_calendar_description(booking: Booking) -> str:
    lines = [
        f"Session Title: {get_booking_session_title(booking)}",
        f"Therapist: {booking.therapist_name_snapshot}",
        f"Client: {booking.client_name}",
        f"Service Type: {SERVICE_TYPE_LABELS[booking.service_type]}",
        f"Session Type: {booking.session_type.capitalize()}",
        f"Quote: {get_booking_quote(booking)}",
    ]

    if booking.session_type == Booking.SessionType.VIRTUAL and booking.meet_link:
        lines.append(f"Virtual Session Link: {build_join_url(booking.manage_token)}")
    else:
        lines.append(f"Location: {booking.location_summary}")

    if booking.notes:
        lines.append(f"Notes: {booking.notes}")

    return "\n".join(lines)


def build_calendar_invite(booking: Booking, kind: str) -> str:
    method = "CANCEL" if kind == EmailRecord.EmailKind.CANCELLATION else "REQUEST"
    status = "CANCELLED" if kind == EmailRecord.EmailKind.CANCELLATION else "CONFIRMED"
    organizer_email = get_organizer_email(booking)
    start_at, end_at = get_booking_time_window(booking)
    summary_prefix = "Cancelled" if kind == EmailRecord.EmailKind.CANCELLATION else "The Wellness Hub"
    summary = f"{summary_prefix}: {get_booking_session_title(booking)} with {booking.therapist_name_snapshot}"
    location = get_session_location(booking)
    url = build_join_url(booking.manage_token) if booking.session_type == Booking.SessionType.VIRTUAL else ""

    lines = [
        "BEGIN:VCALENDAR",
        "PRODID:-//The Wellness Hub//Booking Calendar//EN",
        "VERSION:2.0",
        "CALSCALE:GREGORIAN",
        f"METHOD:{method}",
        "BEGIN:VEVENT",
        f"UID:{escape_ical_text(get_calendar_uid(booking))}",
        f"SEQUENCE:{get_calendar_sequence(booking)}",
        f"DTSTAMP:{timezone.now().astimezone(dt_timezone.utc).strftime('%Y%m%dT%H%M%SZ')}",
        f"DTSTART:{start_at.astimezone(dt_timezone.utc).strftime('%Y%m%dT%H%M%SZ')}",
        f"DTEND:{end_at.astimezone(dt_timezone.utc).strftime('%Y%m%dT%H%M%SZ')}",
        fold_ical_line(f"SUMMARY:{escape_ical_text(summary)}"),
        fold_ical_line(f"DESCRIPTION:{escape_ical_text(build_calendar_description(booking))}"),
        fold_ical_line(f"LOCATION:{escape_ical_text(location)}"),
        f"STATUS:{status}",
        "TRANSP:OPAQUE",
        fold_ical_line(f"ORGANIZER;CN={escape_ical_text(settings.BOOKING_CALENDAR_ORGANIZER_NAME)}:mailto:{organizer_email}"),
        fold_ical_line(
            f"ATTENDEE;CN={escape_ical_text(booking.client_name)};ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:{booking.client_email}"
        ),
        fold_ical_line(
            f"ATTENDEE;CN={escape_ical_text(booking.therapist_name_snapshot)};ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED:mailto:{booking.therapist.email}"
        ),
    ]

    if url:
        lines.append(fold_ical_line(f"URL:{escape_ical_text(url)}"))

    if kind != EmailRecord.EmailKind.CANCELLATION:
        lines.extend(
            [
                "BEGIN:VALARM",
                "ACTION:DISPLAY",
                "DESCRIPTION:Your Wellness Hub session is almost here.",
                "TRIGGER:-PT30M",
                "END:VALARM",
            ]
        )

    lines.extend(
        [
            "END:VEVENT",
            "END:VCALENDAR",
        ]
    )

    return "\r\n".join(lines) + "\r\n"


def build_calendar_filename(kind: str) -> str:
    if kind == EmailRecord.EmailKind.CANCELLATION:
        return "wellness-session-cancelled.ics"

    if kind == EmailRecord.EmailKind.RESCHEDULE:
        return "wellness-session-updated.ics"

    if kind == REMINDER_EMAIL_KIND:
        return "wellness-session-reminder.ics"

    return "wellness-session.ics"


def get_email_deliveries(booking: Booking, kind: str) -> list[dict[str, str]]:
    deliveries = [
        {
            "audience": CLIENT_AUDIENCE,
            "recipient": booking.client_email,
        },
        {
            "audience": THERAPIST_AUDIENCE,
            "recipient": booking.therapist.email,
        },
    ]
    prepared: list[dict[str, str]] = []

    for delivery in deliveries:
        recipient = delivery["recipient"]
        audience = delivery["audience"]
        if not recipient:
            continue
        prepared.append(
            {
                "audience": audience,
                "recipient": recipient,
                "subject": get_email_subject(kind, audience),
                "html": build_email_html(booking, kind, audience),
                "text": build_email_text(booking, kind, audience),
            }
        )

    return prepared


def get_sender_identity(booking: Booking) -> tuple[str, str]:
    name, email = parseaddr(settings.DEFAULT_FROM_EMAIL)
    return name or settings.BOOKING_CALENDAR_ORGANIZER_NAME, email or booking.therapist.email


def send_booking_email_via_brevo(
    *,
    booking: Booking,
    kind: str,
    deliveries: list[dict[str, str]],
    calendar_invite: str,
) -> None:
    sender_name, sender_email = get_sender_identity(booking)
    reply_to_email = settings.WELLNESS_HUB_REPLY_TO or sender_email
    calendar_filename = build_calendar_filename(kind)
    calendar_content = base64.b64encode(calendar_invite.encode("utf-8")).decode("ascii")

    for delivery in deliveries:
        payload = {
            "sender": {
                "name": sender_name,
                "email": sender_email,
            },
            "to": [{"email": delivery["recipient"]}],
            "subject": delivery["subject"],
            "htmlContent": delivery["html"],
            "textContent": delivery["text"],
            "replyTo": {
                "email": reply_to_email,
                "name": sender_name,
            },
            "attachment": [
                {
                    "name": calendar_filename,
                    "content": calendar_content,
                }
            ],
            "tags": [f"booking-{kind}", f"audience-{delivery['audience']}"],
        }

        request = urllib_request.Request(
            settings.BREVO_API_URL,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "accept": "application/json",
                "api-key": settings.BREVO_API_KEY,
                "content-type": "application/json",
            },
            method="POST",
        )

        try:
            with urllib_request.urlopen(request, timeout=settings.BREVO_API_TIMEOUT) as response:
                if response.status not in {200, 201, 202}:
                    raise BookingDeliveryError(
                        "The booking could not be confirmed because Brevo did not accept the email delivery request."
                    )
        except urllib_error.HTTPError as exc:
            details = exc.read().decode("utf-8", errors="replace")
            raise BookingDeliveryError(
                f"The booking could not be confirmed because Brevo rejected the email delivery request. {details}"
            ) from exc
        except urllib_error.URLError as exc:
            raise BookingDeliveryError(
                "The booking could not be confirmed because Brevo could not be reached."
            ) from exc
        except OSError as exc:
            raise BookingDeliveryError(
                "The booking could not be confirmed because the Brevo delivery request failed."
            ) from exc


def send_booking_email(*, booking: Booking, kind: str) -> list[EmailRecord]:
    deliveries = get_email_deliveries(booking, kind)
    calendar_invite = build_calendar_invite(booking, kind)

    if settings.BREVO_API_KEY:
        send_booking_email_via_brevo(
            booking=booking,
            kind=kind,
            deliveries=deliveries,
            calendar_invite=calendar_invite,
        )
    else:
        calendar_method = "CANCEL" if kind == EmailRecord.EmailKind.CANCELLATION else "REQUEST"
        reply_to = [settings.WELLNESS_HUB_REPLY_TO] if settings.WELLNESS_HUB_REPLY_TO else None

        connection = get_connection(fail_silently=False)
        messages: list[EmailMultiAlternatives] = []

        for delivery in deliveries:
            message = EmailMultiAlternatives(
                subject=delivery["subject"],
                body=delivery["text"],
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[delivery["recipient"]],
                reply_to=reply_to,
                headers={"X-Auto-Response-Suppress": "All"},
                connection=connection,
            )
            message.attach_alternative(delivery["html"], "text/html")
            message.attach(
                build_calendar_filename(kind),
                calendar_invite,
                f"text/calendar; method={calendar_method}; charset=UTF-8",
            )
            messages.append(message)

        sent_count = connection.send_messages(messages) or 0

        if sent_count != len(messages):
            raise BookingDeliveryError(
                "The booking could not be confirmed because the email or calendar invite was not delivered."
            )

    records: list[EmailRecord] = []
    for delivery in deliveries:
        records.append(
            EmailRecord.objects.create(
                booking=booking,
                kind=kind,
                subject=delivery["subject"],
                recipients=[delivery["recipient"]],
                html=delivery["html"],
            )
        )
    return records
