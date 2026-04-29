import html
from datetime import timedelta
from unittest.mock import patch
from urllib.parse import parse_qs, urlparse

from django.core.management import call_command
from django.core import mail
from django.test import override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.bookings.models import Booking, BookingPayment
from apps.bookings.delivery import REMINDER_EMAIL_KIND
from apps.bookings.payments import MpesaQueryResponse, MpesaStkPushResponse
from apps.bookings.services import normalize_payment_result_description
from apps.notifications.models import Notification
from apps.therapists.models import TherapistProfile


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    DEFAULT_FROM_EMAIL="The Wellness Hub <no-reply@wellnesshub.local>",
    WELLNESS_HUB_REPLY_TO="hello@wellnesshub.local",
    BOOKING_CALENDAR_UID_DOMAIN="wellnesshub.local",
    BOOKING_CALENDAR_ORGANIZER_NAME="The Wellness Hub",
    BREVO_API_KEY="",
    CRON_SECRET="test-cron-secret",
    BOOKING_PAYMENT_REQUIRED_FOR_SESSIONS=False,
)
class BookingApiTests(APITestCase):
    def setUp(self):
        call_command("bootstrap_wellness_demo")

    def test_create_reschedule_and_cancel_booking_from_manage_token(self):
        create_response = self.client.post(
            "/api/v1/bookings/",
            {
                "clientName": "Test Client",
                "clientEmail": "client@example.com",
                "clientPhone": "+254700000000",
                "therapistId": "caroline-gichia",
                "date": "2028-04-18",
                "time": "10:30",
                "serviceType": "individual",
                "sessionType": "virtual",
                "notes": "First session",
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(create_response.data["status"], Booking.Status.UPCOMING)
        self.assertEqual(create_response.data["emails"], [])
        self.assertEqual(len(create_response.data["history"]), 1)
        self.assertTrue(create_response.data["calendarEventId"])

        self.assertEqual(len(mail.outbox), 2)
        booking_for_links = Booking.objects.select_related("therapist").get(pk=create_response.data["id"])
        actual_meet_link = booking_for_links.meet_link
        self.assertEqual(create_response.data["meetLink"], "")
        self.assertEqual(create_response.data["therapistSessionUrl"], "")
        self.assertEqual(mail.outbox[0].subject, "Your Session Is Confirmed | The Wellness Hub")
        self.assertEqual(mail.outbox[0].to, ["client@example.com"])
        client_html = mail.outbox[0].alternatives[0][0]
        therapist_html = mail.outbox[1].alternatives[0][0]
        self.assertIn("max-width:600px", client_html)
        self.assertIn("max-width:600px", therapist_html)
        self.assertIn("word-break:break-word", client_html)
        self.assertIn("word-break:break-word", therapist_html)
        self.assertNotIn("width:180px", client_html)
        self.assertNotIn("width:180px", therapist_html)
        escaped_manage_url = html.escape(create_response.data["manageUrl"], quote=True)
        escaped_join_url = html.escape(create_response.data["joinUrl"], quote=True)
        escaped_calendar_url = html.escape(create_response.data["addToCalendarUrl"], quote=True)
        self.assertIn("Manage Your Session", client_html)
        self.assertIn(f'href="{escaped_manage_url}"', client_html)
        self.assertIn(f'href="{escaped_join_url}"', client_html)
        self.assertIn(f'href="{escaped_calendar_url}"', client_html)
        self.assertIn("Add to Google Calendar", client_html)
        self.assertIn("Join Virtual Session", client_html)
        self.assertNotIn(f">{escaped_manage_url}<", client_html)
        self.assertNotIn(f">{escaped_join_url}<", client_html)
        self.assertNotIn(f">{escaped_calendar_url}<", client_html)
        self.assertNotIn(actual_meet_link, client_html)
        self.assertNotIn(create_response.data["manageUrl"], mail.outbox[0].body)
        self.assertNotIn(create_response.data["joinUrl"], mail.outbox[0].body)
        self.assertNotIn(actual_meet_link, mail.outbox[0].body)
        self.assertIn("Virtual Session Link", mail.outbox[0].body)
        self.assertEqual(mail.outbox[1].to, ["likentnerg@gmail.com"])
        self.assertEqual(mail.outbox[1].subject, "New Session Booked | The Wellness Hub")
        self.assertIn("Client Email: client@example.com", mail.outbox[1].body)
        escaped_therapist_session_prefix = html.escape("http://localhost:8080/therapist/session/", quote=True)
        self.assertIn(f'href="{escaped_therapist_session_prefix}', therapist_html)
        self.assertIn("Join Virtual Session", therapist_html)
        self.assertNotIn(actual_meet_link, therapist_html)
        self.assertNotIn(f'href="{escaped_join_url}"', therapist_html)
        self.assertIn("Virtual Session Link", mail.outbox[1].body)
        self.assertNotIn(create_response.data["joinUrl"], mail.outbox[1].body)
        self.assertIn("Join Virtual Session", mail.outbox[1].body)
        self.assertNotIn(create_response.data["manageUrl"], mail.outbox[1].body)
        self.assertEqual(mail.outbox[0].attachments[0][0], "wellness-session.ics")
        self.assertIn("METHOD:REQUEST", mail.outbox[0].attachments[0][1])
        self.assertIn(create_response.data["calendarEventId"], mail.outbox[0].attachments[0][1])
        self.assertIn(create_response.data["joinUrl"], mail.outbox[0].attachments[0][1])
        self.assertIn(f"URL:{create_response.data['joinUrl']}", mail.outbox[0].attachments[0][1])
        self.assertIn(f"LOCATION:{create_response.data['joinUrl']}", mail.outbox[0].attachments[0][1])
        self.assertIn("BEGIN:VALARM", mail.outbox[0].attachments[0][1])
        self.assertIn("client@example.com", mail.outbox[0].attachments[0][1])
        self.assertIn("likentnerg@gmail.com", mail.outbox[0].attachments[0][1])
        self.assertNotIn(actual_meet_link, mail.outbox[0].attachments[0][1])
        self.assertNotIn(create_response.data["manageUrl"], mail.outbox[0].attachments[0][1])
        self.assertIn("/therapist/session/", mail.outbox[1].attachments[0][1])
        self.assertIn("URL:http://localhost:8080/therapist/session/", mail.outbox[1].attachments[0][1])
        self.assertIn("LOCATION:http://localhost:8080/therapist/session/", mail.outbox[1].attachments[0][1])
        self.assertNotIn(create_response.data["joinUrl"], mail.outbox[1].attachments[0][1])
        self.assertNotIn(actual_meet_link, mail.outbox[1].attachments[0][1])
        self.assertTrue(actual_meet_link.startswith("https://meet.jit.si/the-wellness-hub-"))
        self.assertTrue(create_response.data["joinUrl"].startswith("http://localhost:8080/join/"))
        self.assertTrue(create_response.data["addToCalendarUrl"].startswith("https://calendar.google.com/calendar/render?"))
        self.assertEqual(create_response.data["therapistAddToCalendarUrl"], "")
        self.assertIn("join", create_response.data["addToCalendarUrl"])
        self.assertGreater(len(create_response.data["addToCalendarUrl"]), 200)
        self.assertGreaterEqual(Booking._meta.get_field("meet_link").max_length, 2048)

        token = create_response.data["token"]
        booking = Booking.objects.select_related("therapist__user").get(pk=create_response.data["id"])
        self.client.force_authenticate(user=booking.therapist.user)
        dashboard_response = self.client.get("/api/v1/dashboard/")
        self.assertEqual(dashboard_response.status_code, status.HTTP_200_OK)
        dashboard_booking = dashboard_response.data["bookings"][0]
        self.assertEqual(dashboard_booking["meetLink"], actual_meet_link)
        self.assertTrue(dashboard_booking["therapistSessionUrl"].startswith("http://localhost:8080/therapist/session/"))
        self.assertEqual(len(dashboard_booking["emails"]), 2)
        self.assertIn("therapist%2Fsession", dashboard_booking["therapistAddToCalendarUrl"])
        self.client.force_authenticate(user=None)

        blocked_therapist_session_response = self.client.get(f"/api/v1/bookings/therapist-session/{token}/")
        self.assertEqual(blocked_therapist_session_response.status_code, status.HTTP_403_FORBIDDEN)

        therapist_session_access = parse_qs(urlparse(dashboard_booking["therapistSessionUrl"]).query)["access"][0]
        therapist_session_response = self.client.get(
            f"/api/v1/bookings/therapist-session/{token}/",
            {"access": therapist_session_access},
        )
        self.assertEqual(therapist_session_response.status_code, status.HTTP_200_OK)
        self.assertTrue(therapist_session_response.data["canJoinSession"])
        self.assertEqual(therapist_session_response.data["meetLink"], actual_meet_link)

        blocked_detail_response = self.client.get(f"/api/v1/bookings/manage/{token}/")
        self.assertEqual(blocked_detail_response.status_code, status.HTTP_403_FORBIDDEN)

        wrong_detail_response = self.client.post(
            f"/api/v1/bookings/manage/{token}/",
            {"email": "other@example.com"},
            format="json",
        )
        self.assertEqual(wrong_detail_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertNotIn("clientEmail", wrong_detail_response.data)

        detail_response = self.client.post(
            f"/api/v1/bookings/manage/{token}/",
            {"email": "client@example.com"},
            format="json",
        )
        self.assertEqual(detail_response.status_code, status.HTTP_200_OK)
        self.assertEqual(detail_response.data["clientName"], "Test Client")
        self.assertEqual(detail_response.data["clientEmail"], "client@example.com")

        join_response = self.client.get(f"/api/v1/bookings/join/{token}/")
        self.assertEqual(join_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertNotIn("clientEmail", join_response.data)

        wrong_join_response = self.client.post(
            f"/api/v1/bookings/join/{token}/",
            {"email": "other@example.com"},
            format="json",
        )
        self.assertEqual(wrong_join_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertNotIn("clientEmail", wrong_join_response.data)

        therapist_join_response = self.client.post(
            f"/api/v1/bookings/join/{token}/",
            {"email": "likentnerg@gmail.com"},
            format="json",
        )
        self.assertEqual(therapist_join_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertNotIn("clientEmail", therapist_join_response.data)

        join_response = self.client.post(
            f"/api/v1/bookings/join/{token}/",
            {"email": "client@example.com"},
            format="json",
        )
        self.assertEqual(join_response.status_code, status.HTTP_200_OK)
        self.assertEqual(join_response.data["joinUrl"], create_response.data["joinUrl"])
        self.assertFalse(join_response.data["canJoinSession"])
        self.assertEqual(join_response.data["meetLink"], "")
        self.assertNotIn("clientEmail", join_response.data)
        self.assertNotIn("clientPhone", join_response.data)
        self.assertNotIn("emails", join_response.data)

        Booking.objects.filter(pk=create_response.data["id"]).update(date=timezone.localdate())
        open_join_response = self.client.post(
            f"/api/v1/bookings/join/{token}/",
            {"email": "client@example.com"},
            format="json",
        )
        self.assertEqual(open_join_response.status_code, status.HTTP_200_OK)
        self.assertTrue(open_join_response.data["canJoinSession"])
        self.assertEqual(open_join_response.data["meetLink"], actual_meet_link)

        reschedule_response = self.client.post(
            f"/api/v1/bookings/manage/{token}/reschedule/",
            {"clientEmail": "client@example.com", "date": "2028-04-19", "time": "12:15"},
            format="json",
        )
        self.assertEqual(reschedule_response.status_code, status.HTTP_200_OK)
        self.assertEqual(reschedule_response.data["status"], Booking.Status.RESCHEDULED)
        self.assertEqual(len(mail.outbox), 4)
        self.assertEqual(mail.outbox[2].subject, "Your Session Has Been Rescheduled | The Wellness Hub")
        self.assertEqual(mail.outbox[3].subject, "Session Rescheduled | The Wellness Hub")
        self.assertEqual(mail.outbox[2].attachments[0][0], "wellness-session-updated.ics")
        self.assertIn("METHOD:REQUEST", mail.outbox[2].attachments[0][1])
        self.assertIn(create_response.data["calendarEventId"], mail.outbox[2].attachments[0][1])
        self.assertIn("SEQUENCE:1", mail.outbox[2].attachments[0][1])
        self.assertIn(reschedule_response.data["joinUrl"], mail.outbox[2].attachments[0][1])

        cancel_response = self.client.post(
            f"/api/v1/bookings/manage/{token}/cancel/",
            {"email": "client@example.com"},
            format="json",
        )
        self.assertEqual(cancel_response.status_code, status.HTTP_200_OK)
        self.assertEqual(cancel_response.data["status"], Booking.Status.CANCELLED)
        self.assertEqual(len(mail.outbox), 6)
        self.assertEqual(mail.outbox[4].subject, "Your Session Has Been Cancelled | The Wellness Hub")
        self.assertEqual(mail.outbox[5].subject, "Session Cancellation Notice | The Wellness Hub")
        self.assertEqual(mail.outbox[4].attachments[0][0], "wellness-session-cancelled.ics")
        self.assertIn("METHOD:CANCEL", mail.outbox[4].attachments[0][1])
        self.assertIn(create_response.data["calendarEventId"], mail.outbox[4].attachments[0][1])
        self.assertIn("SEQUENCE:2", mail.outbox[4].attachments[0][1])

        self.assertEqual(Notification.objects.count(), 3)

    def test_physical_calendar_uses_actual_location_without_site_url(self):
        response = self.client.post(
            "/api/v1/bookings/",
            {
                "clientName": "Physical Client",
                "clientEmail": "physical@example.com",
                "clientPhone": "+254700000777",
                "therapistId": "caroline-gichia",
                "date": "2028-04-18",
                "time": "13:00",
                "serviceType": "individual",
                "sessionType": "physical",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        calendar_invite = mail.outbox[0].attachments[0][1]
        self.assertIn("LOCATION:Nairobi\\, Westlands", calendar_invite)
        self.assertNotIn("URL:http://localhost:8080", calendar_invite)
        self.assertNotIn("/join/", calendar_invite)
        self.assertIn("Nairobi", response.data["addToCalendarUrl"])

    def test_exploration_call_request_sends_distinct_non_calendar_messages(self):
        create_response = self.client.post(
            "/api/v1/bookings/",
            {
                "clientName": "Exploration Client",
                "clientEmail": "explore@example.com",
                "clientPhone": "+254711222333",
                "therapistId": "caroline-gichia",
                "date": "2026-05-16",
                "time": "15:00",
                "serviceType": "individual",
                "sessionType": "virtual",
                "notes": "[exploration-call] Client wants clarity before committing to a full therapy session. I am not sure whether I should begin with individual therapy or something lighter.",
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(create_response.data["isExplorationCall"])
        self.assertEqual(create_response.data["joinUrl"], "")
        self.assertEqual(create_response.data["addToCalendarUrl"], "")
        self.assertEqual(create_response.data["therapistSessionUrl"], "")
        self.assertEqual(create_response.data["notes"], "Client wants clarity before committing to a full therapy session. I am not sure whether I should begin with individual therapy or something lighter.")

        booking = Booking.objects.select_related("therapist__user").get(pk=create_response.data["id"])
        self.assertEqual(booking.meet_link, "")
        self.assertEqual(booking.location_summary, "The therapist will review your request and reach out directly using your phone number or email.")

        self.assertEqual(len(mail.outbox), 2)
        client_message = mail.outbox[0]
        therapist_message = mail.outbox[1]
        client_html = client_message.alternatives[0][0]
        therapist_html = therapist_message.alternatives[0][0]

        self.assertEqual(client_message.subject, "Your Exploration Call Request Was Received | The Wellness Hub")
        self.assertEqual(client_message.to, ["explore@example.com"])
        self.assertEqual(client_message.attachments, [])
        self.assertIn("Open Secure Link", client_html)
        self.assertIn("Thanks for booking an exploration call", client_html)
        self.assertNotIn("Manage Request", client_html)
        self.assertNotIn("Add to Google Calendar", client_html)
        self.assertNotIn("Join Virtual Session", client_html)
        self.assertNotIn("/join/", client_html)
        self.assertIn("Expect a call from the therapist after they review your request.", client_message.body)

        self.assertEqual(therapist_message.subject, "New Exploration Call Request | The Wellness Hub")
        self.assertEqual(therapist_message.to, ["likentnerg@gmail.com"])
        self.assertEqual(therapist_message.attachments, [])
        self.assertIn("Client Phone: +254711222333", therapist_message.body)
        self.assertIn("Open Calls Page", therapist_html)
        self.assertIn("?tab=calls", therapist_html)
        self.assertNotIn("/therapist/session/", therapist_html)
        self.assertNotIn("Add to Google Calendar", therapist_html)

        self.client.force_authenticate(user=booking.therapist.user)
        dashboard_response = self.client.get("/api/v1/dashboard/")
        self.assertEqual(dashboard_response.status_code, status.HTTP_200_OK)
        dashboard_booking = dashboard_response.data["bookings"][0]
        self.assertTrue(dashboard_booking["isExplorationCall"])
        self.assertEqual(dashboard_booking["meetLink"], "")
        self.assertEqual(dashboard_booking["therapistSessionUrl"], "")
        self.assertEqual(dashboard_booking["therapistAddToCalendarUrl"], "")
        self.client.force_authenticate(user=None)

    def test_reminder_cron_requires_secret_and_sends_once(self):
        create_response = self.client.post(
            "/api/v1/bookings/",
            {
                "clientName": "Reminder Client",
                "clientEmail": "reminder@example.com",
                "clientPhone": "+254700000888",
                "therapistId": "caroline-gichia",
                "date": "2028-04-18",
                "time": "14:00",
                "serviceType": "individual",
                "sessionType": "virtual",
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        booking = Booking.objects.get(pk=create_response.data["id"])
        start_at = timezone.localtime(timezone.now() + timedelta(minutes=30)).replace(second=0, microsecond=0)
        booking.date = start_at.date()
        booking.time = start_at.time()
        booking.save(update_fields=["date", "time", "updated_at"])

        unauthorized_response = self.client.get("/api/v1/bookings/reminders/run/")
        self.assertEqual(unauthorized_response.status_code, status.HTTP_401_UNAUTHORIZED)

        reminder_response = self.client.get(
            "/api/v1/bookings/reminders/run/",
            HTTP_AUTHORIZATION="Bearer test-cron-secret",
        )
        self.assertEqual(reminder_response.status_code, status.HTTP_200_OK)
        self.assertEqual(reminder_response.data, {"sent": 1, "failed": 0})
        self.assertEqual(len(mail.outbox), 4)
        self.assertEqual(mail.outbox[2].subject, "Your Session Is Almost Here | The Wellness Hub")
        self.assertEqual(mail.outbox[3].subject, "Upcoming Session Reminder | The Wellness Hub")
        self.assertEqual(mail.outbox[2].attachments[0][0], "wellness-session-reminder.ics")
        self.assertIn("BEGIN:VALARM", mail.outbox[2].attachments[0][1])
        self.assertTrue(Booking.objects.filter(pk=booking.pk, emails__kind=REMINDER_EMAIL_KIND).exists())

        duplicate_response = self.client.get(
            "/api/v1/bookings/reminders/run/",
            HTTP_AUTHORIZATION="Bearer test-cron-secret",
        )
        self.assertEqual(duplicate_response.status_code, status.HTTP_200_OK)
        self.assertEqual(duplicate_response.data, {"sent": 0, "failed": 0})
        self.assertEqual(len(mail.outbox), 4)

    def test_rejects_out_of_hours_booking_and_suggests_first_open_slot(self):
        response = self.client.post(
            "/api/v1/bookings/",
            {
                "clientName": "Early Client",
                "clientEmail": "early@example.com",
                "clientPhone": "+254700000123",
                "therapistId": "caroline-gichia",
                "date": "2028-04-18",
                "time": "09:00",
                "serviceType": "individual",
                "sessionType": "virtual",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["code"], "outside_hours")
        self.assertEqual(response.data["suggestedDate"], "2028-04-18")
        self.assertEqual(response.data["suggestedTime"], "10:00")
        self.assertIn("Tuesday to Saturday", response.data["detail"])

    def test_rejects_overlapping_booking_and_suggests_next_available_slot(self):
        first_response = self.client.post(
            "/api/v1/bookings/",
            {
                "clientName": "Booked Client",
                "clientEmail": "booked@example.com",
                "clientPhone": "+254700000124",
                "therapistId": "caroline-gichia",
                "date": "2028-04-19",
                "time": "11:05",
                "serviceType": "individual",
                "sessionType": "virtual",
            },
            format="json",
        )
        self.assertEqual(first_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(first_response.data["time"], "11:05")

        conflict_response = self.client.post(
            "/api/v1/bookings/",
            {
                "clientName": "Overlap Client",
                "clientEmail": "overlap@example.com",
                "clientPhone": "+254700000125",
                "therapistId": "caroline-gichia",
                "date": "2028-04-19",
                "time": "10:10",
                "serviceType": "individual",
                "sessionType": "virtual",
            },
            format="json",
        )

        self.assertEqual(conflict_response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(conflict_response.data["code"], "slot_unavailable")
        self.assertEqual(conflict_response.data["suggestedDate"], "2028-04-19")
        self.assertEqual(conflict_response.data["suggestedTime"], "12:05")
        self.assertFalse(conflict_response.data["dayFullyBooked"])

    def test_reports_when_requested_day_is_fully_booked(self):
        for hour in range(10, 19):
            create_response = self.client.post(
                "/api/v1/bookings/",
                {
                    "clientName": f"Client {hour}",
                    "clientEmail": f"client-{hour}@example.com",
                    "clientPhone": f"+254700000{hour}",
                    "therapistId": "caroline-gichia",
                    "date": "2028-04-21",
                    "time": f"{hour:02d}:00",
                    "serviceType": "individual",
                    "sessionType": "physical",
                },
                format="json",
            )
            self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)

        response = self.client.post(
            "/api/v1/bookings/",
            {
                "clientName": "Overflow Client",
                "clientEmail": "overflow@example.com",
                "clientPhone": "+254700000999",
                "therapistId": "caroline-gichia",
                "date": "2028-04-21",
                "time": "14:30",
                "serviceType": "individual",
                "sessionType": "physical",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(response.data["code"], "day_full")
        self.assertTrue(response.data["dayFullyBooked"])
        self.assertEqual(response.data["suggestedDate"], "2028-04-22")
        self.assertEqual(response.data["suggestedTime"], "10:00")

    def test_same_email_cannot_hold_multiple_live_sessions(self):
        first_response = self.client.post(
            "/api/v1/bookings/",
            {
                "clientName": "Repeat Client",
                "clientEmail": "repeat@example.com",
                "clientPhone": "+254700000126",
                "therapistId": "caroline-gichia",
                "date": "2028-04-25",
                "time": "11:00",
                "serviceType": "individual",
                "sessionType": "virtual",
            },
            format="json",
        )
        self.assertEqual(first_response.status_code, status.HTTP_201_CREATED)

        blocked_response = self.client.post(
            "/api/v1/bookings/",
            {
                "clientName": "Repeat Client",
                "clientEmail": "repeat@example.com",
                "clientPhone": "+254700000126",
                "therapistId": "caroline-gichia",
                "date": "2028-04-26",
                "time": "13:00",
                "serviceType": "individual",
                "sessionType": "virtual",
            },
            format="json",
        )
        self.assertEqual(blocked_response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(blocked_response.data["code"], "active_session_exists")
        self.assertIn("You already have an active session booked", blocked_response.data["detail"])

        Booking.objects.filter(pk=first_response.data["id"]).update(status=Booking.Status.COMPLETED)

        allowed_response = self.client.post(
            "/api/v1/bookings/",
            {
                "clientName": "Repeat Client",
                "clientEmail": "repeat@example.com",
                "clientPhone": "+254700000126",
                "therapistId": "caroline-gichia",
                "date": "2028-04-26",
                "time": "13:00",
                "serviceType": "individual",
                "sessionType": "virtual",
            },
            format="json",
        )
        self.assertEqual(allowed_response.status_code, status.HTTP_201_CREATED)

    def test_therapist_can_delete_booking_with_reason(self):
        create_response = self.client.post(
            "/api/v1/bookings/",
            {
                "clientName": "Delete Me",
                "clientEmail": "deleteme@example.com",
                "clientPhone": "+254700111222",
                "therapistId": "caroline-gichia",
                "date": "2028-04-22",
                "time": "11:00",
                "serviceType": "individual",
                "sessionType": "physical",
                "notes": "Duplicate session",
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)

        booking = Booking.objects.select_related("therapist__user").get(pk=create_response.data["id"])
        self.client.force_authenticate(user=booking.therapist.user)

        delete_response = self.client.post(
            f"/api/v1/dashboard/bookings/{booking.id}/delete/",
            {"reason": "Duplicate session created by mistake."},
            format="json",
        )
        self.assertEqual(delete_response.status_code, status.HTTP_200_OK)
        booking.refresh_from_db()
        self.assertIsNotNone(booking.deleted_at)
        self.assertEqual(booking.deleted_reason, "Duplicate session created by mistake.")

        dashboard_response = self.client.get("/api/v1/dashboard/")
        self.assertEqual(dashboard_response.status_code, status.HTTP_200_OK)
        self.assertEqual(dashboard_response.data["bookings"], [])

        manage_response = self.client.get(f"/api/v1/bookings/manage/{create_response.data['token']}/")
        self.assertEqual(manage_response.status_code, status.HTTP_404_NOT_FOUND)


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    DEFAULT_FROM_EMAIL="The Wellness Hub <no-reply@wellnesshub.local>",
    WELLNESS_HUB_REPLY_TO="hello@wellnesshub.local",
    BOOKING_CALENDAR_UID_DOMAIN="wellnesshub.local",
    BOOKING_CALENDAR_ORGANIZER_NAME="The Wellness Hub",
    BREVO_API_KEY="",
    BOOKING_PAYMENT_REQUIRED_FOR_SESSIONS=True,
    MPESA_SIMULATE_PAYMENTS=True,
)
class PaidBookingCheckoutApiTests(APITestCase):
    def setUp(self):
        call_command("bootstrap_wellness_demo")

    def confirm_paid_booking(
        self,
        *,
        client_name: str = "Paid Client",
        client_email: str = "paid@example.com",
        client_phone: str = "+254700444555",
        date: str = "2026-06-18",
        time: str = "11:00",
        session_type: str = "virtual",
        notes: str = "Needs a first session",
        mpesa_phone_number: str = "0712345555",
        therapist_id: str = "caroline-gichia",
    ) -> tuple[Booking, BookingPayment]:
        checkout_response = self.client.post(
            "/api/v1/bookings/checkout/",
            {
                "clientName": client_name,
                "clientEmail": client_email,
                "clientPhone": client_phone,
                "therapistId": therapist_id,
                "date": date,
                "time": time,
                "serviceType": "individual",
                "sessionType": session_type,
                "notes": notes,
                "mpesaPhoneNumber": mpesa_phone_number,
            },
            format="json",
        )
        self.assertEqual(checkout_response.status_code, status.HTTP_201_CREATED)

        booking = Booking.objects.select_related("therapist__user").get(pk=checkout_response.data["booking"]["id"])
        payment = BookingPayment.objects.get(pk=checkout_response.data["payment"]["id"])
        BookingPayment.objects.filter(pk=payment.pk).update(created_at=timezone.now() - timedelta(seconds=8))

        status_response = self.client.get(
            f"/api/v1/bookings/checkout/{booking.manage_token}/payments/{payment.id}/status/"
        )
        self.assertEqual(status_response.status_code, status.HTTP_200_OK)
        self.assertEqual(status_response.data["payment"]["status"], BookingPayment.Status.SUCCESS)
        self.assertEqual(status_response.data["booking"]["status"], Booking.Status.UPCOMING)
        booking.refresh_from_db()
        payment.refresh_from_db()
        return booking, payment

    def test_paid_booking_checkout_success_confirms_booking_and_records_transaction(self):
        booking, payment = self.confirm_paid_booking()
        self.assertIsNotNone(booking.confirmed_at)
        self.assertEqual(booking.status, Booking.Status.UPCOMING)
        self.assertTrue(payment.transaction_id.startswith("THB"))
        self.assertEqual(len(mail.outbox), 2)

        manage_response = self.client.post(
            f"/api/v1/bookings/manage/{booking.manage_token}/",
            {"email": "paid@example.com"},
            format="json",
        )
        self.assertEqual(manage_response.status_code, status.HTTP_200_OK)
        self.assertEqual(manage_response.data["payment"]["transactionId"], payment.transaction_id)
        self.assertEqual(manage_response.data["payment"]["paymentMethod"], "M-Pesa STK Push")

        self.client.force_authenticate(user=booking.therapist.user)
        dashboard_response = self.client.get("/api/v1/dashboard/")
        self.assertEqual(dashboard_response.status_code, status.HTTP_200_OK)
        self.assertEqual(dashboard_response.data["transactions"][0]["transactionId"], payment.transaction_id)
        self.assertEqual(dashboard_response.data["bookings"][0]["payment"]["transactionId"], payment.transaction_id)
        self.client.force_authenticate(user=None)

    def test_selected_therapist_receives_email_and_dashboard_scope(self):
        booking, payment = self.confirm_paid_booking(
            client_name="Kelvin Client",
            client_email="kelvin-client@example.com",
            client_phone="+254700555666",
            date="2026-07-03",
            time="10:00",
            mpesa_phone_number="0712345666",
            therapist_id="kelvin-kagiri",
        )
        self.assertEqual(booking.therapist.public_id, "kelvin-kagiri")
        self.assertEqual(booking.therapist_name_snapshot, "Kelvin Kagiri")
        self.assertEqual(len(mail.outbox), 2)
        self.assertEqual(mail.outbox[0].to, ["kelvin-client@example.com"])
        self.assertIn("Kelvin Kagiri", mail.outbox[0].body)
        self.assertEqual(mail.outbox[1].to, ["ndemojnrr@gmail.com"])

        caroline = TherapistProfile.objects.select_related("user").get(public_id="caroline-gichia")
        kelvin = TherapistProfile.objects.select_related("user").get(public_id="kelvin-kagiri")
        self.assertEqual(Notification.objects.filter(therapist=kelvin).count(), 1)
        self.assertEqual(Notification.objects.filter(therapist=caroline).count(), 0)

        self.client.force_authenticate(user=caroline.user)
        caroline_dashboard = self.client.get("/api/v1/dashboard/")
        self.assertEqual(caroline_dashboard.status_code, status.HTTP_200_OK)
        self.assertEqual(caroline_dashboard.data["bookings"], [])
        self.assertEqual(caroline_dashboard.data["transactions"], [])

        self.client.force_authenticate(user=kelvin.user)
        kelvin_dashboard = self.client.get("/api/v1/dashboard/")
        self.assertEqual(kelvin_dashboard.status_code, status.HTTP_200_OK)
        self.assertEqual(len(kelvin_dashboard.data["bookings"]), 1)
        self.assertEqual(kelvin_dashboard.data["bookings"][0]["therapistId"], "kelvin-kagiri")
        self.assertEqual(kelvin_dashboard.data["transactions"][0]["id"], str(payment.id))
        self.client.force_authenticate(user=None)

    def test_precheck_reports_active_session_before_payment_step(self):
        self.confirm_paid_booking(
            client_email="repeat-paid@example.com",
            client_phone="+254700111444",
            date="2026-06-24",
            time="10:00",
            mpesa_phone_number="0712345444",
        )

        response = self.client.post(
            "/api/v1/bookings/precheck/",
            {
                "clientName": "Repeat Paid Client",
                "clientEmail": "repeat-paid@example.com",
                "clientPhone": "+254700111444",
                "therapistId": "caroline-gichia",
                "date": "2026-06-25",
                "time": "12:00",
                "serviceType": "individual",
                "sessionType": "virtual",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(response.data["code"], "active_session_exists")
        self.assertIn("You already have an active session booked", response.data["detail"])

    def test_precheck_ignores_legacy_upcoming_records_without_confirmation(self):
        therapist = TherapistProfile.objects.get(public_id="caroline-gichia")
        Booking.objects.create(
            manage_token="legacy-upcoming-record",
            client_name="Legacy Client",
            client_email="legacy-upcoming@example.com",
            client_phone="+254700555666",
            therapist=therapist,
            therapist_name_snapshot=therapist.name,
            service_type=Booking.ServiceType.INDIVIDUAL,
            session_type=Booking.SessionType.VIRTUAL,
            date="2026-06-30",
            time="10:00",
            status=Booking.Status.UPCOMING,
            location_summary="Online session access will be shared in your calendar-ready confirmation.",
            calendar_event_id="legacy-upcoming-calendar",
            meet_link="",
            booking_fee_amount="200.00",
            booking_fee_currency="KES",
            confirmed_at=None,
        )

        response = self.client.post(
            "/api/v1/bookings/precheck/",
            {
                "clientName": "Legacy Client",
                "clientEmail": "legacy-upcoming@example.com",
                "clientPhone": "+254700555666",
                "therapistId": "caroline-gichia",
                "date": "2026-06-30",
                "time": "10:00",
                "serviceType": "individual",
                "sessionType": "virtual",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["ok"])
        self.assertTrue(response.data["requiresPayment"])

    def test_direct_booking_endpoint_checks_slot_before_payment_required(self):
        self.confirm_paid_booking(
            client_email="occupied-slot@example.com",
            client_phone="+254700222333",
            date="2026-06-26",
            time="12:00",
            mpesa_phone_number="0712345444",
        )

        response = self.client.post(
            "/api/v1/bookings/",
            {
                "clientName": "Conflict Client",
                "clientEmail": "conflict@example.com",
                "clientPhone": "+254700999888",
                "therapistId": "caroline-gichia",
                "date": "2026-06-26",
                "time": "12:00",
                "serviceType": "individual",
                "sessionType": "virtual",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(response.data["code"], "slot_unavailable")

    def test_paid_booking_checkout_accepts_safaricom_01_numbers(self):
        checkout_response = self.client.post(
            "/api/v1/bookings/checkout/",
            {
                "clientName": "Paid Client",
                "clientEmail": "paid-01@example.com",
                "clientPhone": "+254711111111",
                "therapistId": "caroline-gichia",
                "date": "2026-06-23",
                "time": "11:00",
                "serviceType": "individual",
                "sessionType": "virtual",
                "notes": "Uses a newer Safaricom line",
                "mpesaPhoneNumber": "0112345678",
            },
            format="json",
        )
        self.assertEqual(checkout_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(checkout_response.data["payment"]["phoneNumber"], "254112345678")

    def test_failed_checkout_can_be_retried_with_a_new_number(self):
        checkout_response = self.client.post(
            "/api/v1/bookings/checkout/",
            {
                "clientName": "Retry Client",
                "clientEmail": "retry@example.com",
                "clientPhone": "+254700888999",
                "therapistId": "caroline-gichia",
                "date": "2026-06-19",
                "time": "14:00",
                "serviceType": "individual",
                "sessionType": "physical",
                "mpesaPhoneNumber": "0711111222",
            },
            format="json",
        )
        self.assertEqual(checkout_response.status_code, status.HTTP_201_CREATED)

        booking = Booking.objects.get(pk=checkout_response.data["booking"]["id"])
        payment = BookingPayment.objects.get(pk=checkout_response.data["payment"]["id"])
        BookingPayment.objects.filter(pk=payment.pk).update(created_at=timezone.now() - timedelta(seconds=8))

        status_response = self.client.get(
            f"/api/v1/bookings/checkout/{booking.manage_token}/payments/{payment.id}/status/"
        )
        self.assertEqual(status_response.status_code, status.HTTP_200_OK)
        self.assertEqual(status_response.data["payment"]["status"], BookingPayment.Status.TIMED_OUT)

        booking.refresh_from_db()
        payment.refresh_from_db()
        self.assertEqual(booking.status, Booking.Status.PAYMENT_FAILED)
        self.assertEqual(len(mail.outbox), 0)

        retry_response = self.client.post(
            "/api/v1/bookings/checkout/retry/",
            {
                "bookingToken": booking.manage_token,
                "mpesaPhoneNumber": "0711111555",
            },
            format="json",
        )
        self.assertEqual(retry_response.status_code, status.HTTP_200_OK)
        self.assertEqual(retry_response.data["booking"]["status"], Booking.Status.PAYMENT_PENDING)
        self.assertEqual(retry_response.data["payment"]["status"], BookingPayment.Status.STK_PUSH_SENT)

    def test_normalizes_wrong_pin_style_mpesa_message_for_client_feedback(self):
        message = normalize_payment_result_description("The initiator information is invalid.")
        self.assertIn("PIN", message)
        self.assertIn("not accepted", message)

    @override_settings(
        MPESA_SIMULATE_PAYMENTS=False,
        MPESA_CONSUMER_KEY="test-key",
        MPESA_CONSUMER_SECRET="test-secret",
        MPESA_SHORTCODE="174379",
        MPESA_PASSKEY="test-passkey",
        MPESA_CALLBACK_URL="https://example.com/api/v1/payments/mpesa/callback/",
    )
    @patch("apps.bookings.services.query_stk_push_status")
    @patch("apps.bookings.services.initiate_stk_push")
    def test_status_endpoint_waits_for_callback_before_surface_query_failure(
        self,
        initiate_stk_push_mock,
        query_stk_push_status_mock,
    ):
        unique_tag = timezone.now().strftime("%H%M%S%f")
        initiate_stk_push_mock.return_value = MpesaStkPushResponse(
            merchant_request_id="mr_live_wait",
            checkout_request_id="ws_live_wait",
            raw={
                "MerchantRequestID": "mr_live_wait",
                "CheckoutRequestID": "ws_live_wait",
                "ResponseCode": "0",
                "ResponseDescription": "Success. Request accepted for processing",
            },
        )
        query_stk_push_status_mock.return_value = MpesaQueryResponse(
            is_final=True,
            result_code="2001",
            result_description="Status confirmation is still pending final M-Pesa settlement.",
            raw={
                "ResponseCode": "0",
                "ResponseDescription": "The transaction status has been received.",
                "CheckoutRequestID": "ws_live_wait",
                "ResultCode": "2001",
                "ResultDesc": "Status confirmation is still pending final M-Pesa settlement.",
            },
            metadata={},
        )

        checkout_response = self.client.post(
            "/api/v1/bookings/checkout/",
            {
                "clientName": "Live Wait Client",
                "clientEmail": f"live-wait-{unique_tag}@example.com",
                "clientPhone": "+254700777888",
                "therapistId": "caroline-gichia",
                "date": "2028-09-29",
                "time": "16:30",
                "serviceType": "individual",
                "sessionType": "virtual",
                "notes": "Wait for callback before failure.",
                "mpesaPhoneNumber": "0712345678",
            },
            format="json",
        )
        self.assertEqual(checkout_response.status_code, status.HTTP_201_CREATED)

        booking = Booking.objects.get(pk=checkout_response.data["booking"]["id"])
        payment = BookingPayment.objects.get(pk=checkout_response.data["payment"]["id"])

        status_response = self.client.get(
            f"/api/v1/bookings/checkout/{booking.manage_token}/payments/{payment.id}/status/"
        )
        self.assertEqual(status_response.status_code, status.HTTP_200_OK)
        self.assertEqual(status_response.data["payment"]["status"], BookingPayment.Status.PROCESSING)
        self.assertEqual(status_response.data["booking"]["status"], Booking.Status.PAYMENT_PENDING)
        self.assertEqual(len(mail.outbox), 0)

        callback_response = self.client.post(
            "/api/v1/payments/mpesa/callback/",
            {
                "Body": {
                    "stkCallback": {
                        "MerchantRequestID": "mr_live_wait",
                        "CheckoutRequestID": "ws_live_wait",
                        "ResultCode": 0,
                        "ResultDesc": "The service request is processed successfully.",
                        "CallbackMetadata": {
                            "Item": [
                                {"Name": "Amount", "Value": 200},
                                {"Name": "MpesaReceiptNumber", "Value": "QWE123456"},
                                {"Name": "PhoneNumber", "Value": 254712345678},
                            ]
                        },
                    }
                }
            },
            format="json",
        )
        self.assertEqual(callback_response.status_code, status.HTTP_200_OK)

        final_status_response = self.client.get(
            f"/api/v1/bookings/checkout/{booking.manage_token}/payments/{payment.id}/status/"
        )
        self.assertEqual(final_status_response.status_code, status.HTTP_200_OK)
        self.assertEqual(final_status_response.data["payment"]["status"], BookingPayment.Status.SUCCESS)
        self.assertEqual(final_status_response.data["booking"]["status"], Booking.Status.UPCOMING)

        booking.refresh_from_db()
        payment.refresh_from_db()
        self.assertEqual(booking.status, Booking.Status.UPCOMING)
        self.assertEqual(payment.status, BookingPayment.Status.SUCCESS)
        self.assertEqual(payment.transaction_id, "QWE123456")
        self.assertEqual(len(mail.outbox), 2)

    def test_direct_full_session_booking_requires_payment_flow(self):
        response = self.client.post(
            "/api/v1/bookings/",
            {
                "clientName": "Direct Client",
                "clientEmail": "direct@example.com",
                "clientPhone": "+254700123456",
                "therapistId": "caroline-gichia",
                "date": "2026-06-20",
                "time": "12:00",
                "serviceType": "individual",
                "sessionType": "virtual",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["code"], "payment_required")

    @override_settings(
        MPESA_SIMULATE_PAYMENTS=False,
        MPESA_CONSUMER_KEY="",
        MPESA_CONSUMER_SECRET="",
        MPESA_SHORTCODE="",
        MPESA_PASSKEY="",
        MPESA_CALLBACK_URL="",
    )
    def test_checkout_reports_which_mpesa_configuration_fields_are_missing(self):
        response = self.client.post(
            "/api/v1/bookings/checkout/",
            {
                "clientName": "Config Client",
                "clientEmail": "config@example.com",
                "clientPhone": "+254700123456",
                "therapistId": "caroline-gichia",
                "date": "2026-06-27",
                "time": "10:00",
                "serviceType": "individual",
                "sessionType": "virtual",
                "mpesaPhoneNumber": "0712345678",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(response.data["code"], "mpesa_not_configured")
        self.assertIn("MPESA_CONSUMER_KEY", response.data["detail"])
        self.assertIn("MPESA_CONSUMER_SECRET", response.data["detail"])
        self.assertIn("MPESA_SHORTCODE", response.data["detail"])
        self.assertIn("MPESA_PASSKEY", response.data["detail"])
        self.assertIn("MPESA_CALLBACK_URL", response.data["detail"])
