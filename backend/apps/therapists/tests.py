from django.core.management import call_command
from rest_framework import status
from rest_framework.test import APITestCase

from apps.therapists.models import TherapistProfile


class TherapistAuthApiTests(APITestCase):
    def setUp(self):
        call_command("bootstrap_wellness_demo")

    def test_verify_passphrase_and_login(self):
        verify_response = self.client.post(
            "/api/v1/auth/verify-passphrase/",
            {"passphrase": "gichia"},
            format="json",
        )
        self.assertEqual(verify_response.status_code, status.HTTP_200_OK)
        self.assertEqual(verify_response.data["email"], "linkentnerg@gmail.com")

        login_response = self.client.post(
            "/api/v1/auth/login/",
            {
                "email": "linkentnerg@gmail.com",
                "password": "WellnessHub2026!",
            },
            format="json",
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertIn("access", login_response.data)
        self.assertIn("refresh", login_response.data)
        self.assertEqual(login_response.data["therapist"]["id"], "caroline-gichia")

    def test_reset_password_with_secret_passphrase(self):
        response = self.client.post(
            "/api/v1/auth/reset-password/",
            {
                "email": "linkentnerg@gmail.com",
                "secretPassphrase": "gichia",
                "nextPassword": "NewWellnessHub2026!",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        therapist = TherapistProfile.objects.select_related("user").get(public_id="caroline-gichia")
        self.assertTrue(therapist.user.check_password("NewWellnessHub2026!"))
