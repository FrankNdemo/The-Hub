from django.core.management import call_command
from rest_framework import status
from rest_framework.test import APITestCase

from apps.bookings.models import Booking
from apps.notifications.models import Notification


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
        self.assertEqual(len(create_response.data["emails"]), 1)
        self.assertEqual(len(create_response.data["history"]), 1)

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

        cancel_response = self.client.post(f"/api/v1/bookings/manage/{token}/cancel/", {}, format="json")
        self.assertEqual(cancel_response.status_code, status.HTTP_200_OK)
        self.assertEqual(cancel_response.data["status"], Booking.Status.CANCELLED)

        self.assertEqual(Notification.objects.count(), 3)
