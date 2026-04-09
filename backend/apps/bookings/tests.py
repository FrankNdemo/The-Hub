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
                "date": "2026-04-12",
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
        self.assertIn("Manage Your Session", mail.outbox[0].alternatives[0][0])
        self.assertIn(create_response.data["manageUrl"], mail.outbox[0].body)
        self.assertIn("Google Meet Link", mail.outbox[0].body)
        self.assertIn(create_response.data["meetLink"], mail.outbox[0].body)
        self.assertEqual(mail.outbox[1].to, ["likentnerg@gmail.com"])
        self.assertEqual(mail.outbox[1].subject, "New Session Booked | The Wellness Hub")
        self.assertIn("Client Email: client@example.com", mail.outbox[1].body)
        self.assertIn("Google Meet Link", mail.outbox[1].body)
        self.assertIn(create_response.data["meetLink"], mail.outbox[1].body)
        self.assertNotIn(create_response.data["manageUrl"], mail.outbox[1].body)
        self.assertEqual(mail.outbox[0].attachments[0][0], "wellness-session.ics")
        self.assertIn("METHOD:REQUEST", mail.outbox[0].attachments[0][1])
        self.assertIn(create_response.data["calendarEventId"], mail.outbox[0].attachments[0][1])
        self.assertIn(create_response.data["meetLink"], mail.outbox[0].attachments[0][1])
        self.assertIn("client@example.com", mail.outbox[0].attachments[0][1])
        self.assertIn("likentnerg@gmail.com", mail.outbox[0].attachments[0][1])
        self.assertNotIn(create_response.data["manageUrl"], mail.outbox[0].attachments[0][1])

        token = create_response.data["token"]
        detail_response = self.client.get(f"/api/v1/bookings/manage/{token}/")
        self.assertEqual(detail_response.status_code, status.HTTP_200_OK)
        self.assertEqual(detail_response.data["clientName"], "Test Client")

        reschedule_response = self.client.post(
            f"/api/v1/bookings/manage/{token}/reschedule/",
            {"date": "2026-04-14", "time": "12:15"},
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
