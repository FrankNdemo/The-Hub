import html

from django.core.management import call_command
from django.core import mail
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from apps.bookings.models import Booking
from apps.notifications.models import Notification


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    DEFAULT_FROM_EMAIL="The Wellness Hub <no-reply@wellnesshub.local>",
    WELLNESS_HUB_REPLY_TO="hello@wellnesshub.local",
    BOOKING_CALENDAR_UID_DOMAIN="wellnesshub.local",
    BOOKING_CALENDAR_ORGANIZER_NAME="The Wellness Hub",
    BREVO_API_KEY="",
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
        self.assertEqual(len(create_response.data["emails"]), 2)
        self.assertEqual(len(create_response.data["history"]), 1)
        self.assertTrue(create_response.data["calendarEventId"])
        self.assertTrue(all("max-width:600px" in email["html"] for email in create_response.data["emails"]))
        self.assertTrue(all("word-break:break-word" in email["html"] for email in create_response.data["emails"]))
        self.assertTrue(all("width:180px" not in email["html"] for email in create_response.data["emails"]))
        self.assertEqual(
            {email["subject"] for email in create_response.data["emails"]},
            {
                "Your Session Is Confirmed | The Wellness Hub",
                "New Session Booked | The Wellness Hub",
            },
        )

        self.assertEqual(len(mail.outbox), 2)
        self.assertEqual(mail.outbox[0].subject, "Your Session Is Confirmed | The Wellness Hub")
        self.assertEqual(mail.outbox[0].to, ["client@example.com"])
        client_html = mail.outbox[0].alternatives[0][0]
        therapist_html = mail.outbox[1].alternatives[0][0]
        escaped_manage_url = html.escape(create_response.data["manageUrl"], quote=True)
        escaped_meet_link = html.escape(create_response.data["meetLink"], quote=True)
        escaped_calendar_url = html.escape(create_response.data["addToCalendarUrl"], quote=True)
        escaped_therapist_calendar_url = html.escape(create_response.data["therapistAddToCalendarUrl"], quote=True)
        self.assertIn("Manage Your Session", client_html)
        self.assertIn(f'href="{escaped_manage_url}"', client_html)
        self.assertIn(f'href="{escaped_meet_link}"', client_html)
        self.assertIn(f'href="{escaped_calendar_url}"', client_html)
        self.assertIn("Add to Google Calendar", client_html)
        self.assertIn("Join Virtual Session", client_html)
        self.assertNotIn(f">{escaped_manage_url}<", client_html)
        self.assertNotIn(f">{escaped_meet_link}<", client_html)
        self.assertNotIn(f">{escaped_calendar_url}<", client_html)
        self.assertNotIn(create_response.data["manageUrl"], mail.outbox[0].body)
        self.assertNotIn(create_response.data["meetLink"], mail.outbox[0].body)
        self.assertIn("Virtual Session Link", mail.outbox[0].body)
        self.assertEqual(mail.outbox[1].to, ["likentnerg@gmail.com"])
        self.assertEqual(mail.outbox[1].subject, "New Session Booked | The Wellness Hub")
        self.assertIn("Client Email: client@example.com", mail.outbox[1].body)
        self.assertIn(f'href="{escaped_meet_link}"', therapist_html)
        self.assertIn(f'href="{escaped_therapist_calendar_url}"', therapist_html)
        self.assertIn("Join Virtual Session", therapist_html)
        self.assertNotIn(f">{escaped_meet_link}<", therapist_html)
        self.assertNotIn(f">{escaped_therapist_calendar_url}<", therapist_html)
        self.assertIn("Virtual Session Link", mail.outbox[1].body)
        self.assertNotIn(create_response.data["meetLink"], mail.outbox[1].body)
        self.assertNotIn(create_response.data["manageUrl"], mail.outbox[1].body)
        self.assertEqual(mail.outbox[0].attachments[0][0], "wellness-session.ics")
        self.assertIn("METHOD:REQUEST", mail.outbox[0].attachments[0][1])
        self.assertIn(create_response.data["calendarEventId"], mail.outbox[0].attachments[0][1])
        self.assertIn(create_response.data["meetLink"], mail.outbox[0].attachments[0][1])
        self.assertIn(f"URL:{create_response.data['meetLink']}", mail.outbox[0].attachments[0][1])
        self.assertIn(f"LOCATION:{create_response.data['meetLink']}", mail.outbox[0].attachments[0][1])
        self.assertIn("client@example.com", mail.outbox[0].attachments[0][1])
        self.assertIn("likentnerg@gmail.com", mail.outbox[0].attachments[0][1])
        self.assertNotIn(create_response.data["manageUrl"], mail.outbox[0].attachments[0][1])
        self.assertTrue(create_response.data["meetLink"].startswith("https://meet.jit.si/the-wellness-hub-"))
        self.assertTrue(create_response.data["addToCalendarUrl"].startswith("https://calendar.google.com/calendar/render?"))
        self.assertTrue(create_response.data["therapistAddToCalendarUrl"].startswith("https://calendar.google.com/calendar/render?"))
        self.assertIn("Test+Client", create_response.data["therapistAddToCalendarUrl"])
        self.assertGreater(len(create_response.data["addToCalendarUrl"]), 200)
        self.assertGreaterEqual(Booking._meta.get_field("meet_link").max_length, 2048)

        token = create_response.data["token"]
        detail_response = self.client.get(f"/api/v1/bookings/manage/{token}/")
        self.assertEqual(detail_response.status_code, status.HTTP_200_OK)
        self.assertEqual(detail_response.data["clientName"], "Test Client")

        reschedule_response = self.client.post(
            f"/api/v1/bookings/manage/{token}/reschedule/",
            {"date": "2026-04-15", "time": "12:15"},
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
        self.assertIn(reschedule_response.data["meetLink"], mail.outbox[2].attachments[0][1])

        cancel_response = self.client.post(f"/api/v1/bookings/manage/{token}/cancel/", {}, format="json")
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
                "time": "10:30",
                "serviceType": "individual",
                "sessionType": "virtual",
            },
            format="json",
        )
        self.assertEqual(first_response.status_code, status.HTTP_201_CREATED)

        conflict_response = self.client.post(
            "/api/v1/bookings/",
            {
                "clientName": "Overlap Client",
                "clientEmail": "overlap@example.com",
                "clientPhone": "+254700000125",
                "therapistId": "caroline-gichia",
                "date": "2026-04-15",
                "time": "11:00",
                "serviceType": "individual",
                "sessionType": "virtual",
            },
            format="json",
        )

        self.assertEqual(conflict_response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(conflict_response.data["code"], "slot_unavailable")
        self.assertEqual(conflict_response.data["suggestedDate"], "2026-04-15")
        self.assertEqual(conflict_response.data["suggestedTime"], "11:30")
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
