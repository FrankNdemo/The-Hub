import html
from datetime import timedelta
from urllib.parse import parse_qs, urlparse

from django.core.management import call_command
from django.core import mail
from django.test import override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.bookings.models import Booking
from apps.bookings.delivery import REMINDER_EMAIL_KIND
from apps.notifications.models import Notification


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    DEFAULT_FROM_EMAIL="The Wellness Hub <no-reply@wellnesshub.local>",
    WELLNESS_HUB_REPLY_TO="hello@wellnesshub.local",
    BOOKING_CALENDAR_UID_DOMAIN="wellnesshub.local",
    BOOKING_CALENDAR_ORGANIZER_NAME="The Wellness Hub",
    BREVO_API_KEY="",
    CRON_SECRET="test-cron-secret",
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
                "date": "2026-04-14",
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
        self.assertIn('href="http://localhost:8080/therapist/session/', therapist_html)
        self.assertIn("Open Therapist Room", therapist_html)
        self.assertNotIn(actual_meet_link, therapist_html)
        self.assertNotIn(f">{escaped_join_url}<", therapist_html)
        self.assertIn("Virtual Session Link", mail.outbox[1].body)
        self.assertNotIn(create_response.data["joinUrl"], mail.outbox[1].body)
        self.assertIn("Open Therapist Room", mail.outbox[1].body)
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
            {"clientEmail": "client@example.com", "date": "2026-04-15", "time": "12:15"},
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
                "date": "2026-04-14",
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

    def test_reminder_cron_requires_secret_and_sends_once(self):
        create_response = self.client.post(
            "/api/v1/bookings/",
            {
                "clientName": "Reminder Client",
                "clientEmail": "reminder@example.com",
                "clientPhone": "+254700000888",
                "therapistId": "caroline-gichia",
                "date": "2026-04-14",
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
                "date": "2026-04-14",
                "time": "09:00",
                "serviceType": "individual",
                "sessionType": "virtual",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["code"], "outside_hours")
        self.assertEqual(response.data["suggestedDate"], "2026-04-14")
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
                "date": "2026-04-15",
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
                "date": "2026-04-15",
                "time": "10:10",
                "serviceType": "individual",
                "sessionType": "virtual",
            },
            format="json",
        )

        self.assertEqual(conflict_response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(conflict_response.data["code"], "slot_unavailable")
        self.assertEqual(conflict_response.data["suggestedDate"], "2026-04-15")
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
                    "date": "2026-04-17",
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
                "date": "2026-04-17",
                "time": "14:30",
                "serviceType": "individual",
                "sessionType": "physical",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(response.data["code"], "day_full")
        self.assertTrue(response.data["dayFullyBooked"])
        self.assertEqual(response.data["suggestedDate"], "2026-04-18")
        self.assertEqual(response.data["suggestedTime"], "10:00")

    def test_same_email_cannot_hold_multiple_live_sessions(self):
        first_response = self.client.post(
            "/api/v1/bookings/",
            {
                "clientName": "Repeat Client",
                "clientEmail": "repeat@example.com",
                "clientPhone": "+254700000126",
                "therapistId": "caroline-gichia",
                "date": "2026-04-21",
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
                "date": "2026-04-22",
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
                "date": "2026-04-22",
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
                "date": "2026-04-18",
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
