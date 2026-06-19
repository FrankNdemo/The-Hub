import json
from unittest.mock import Mock, patch

from django.core.management import call_command
from django.contrib.auth.tokens import default_token_generator
from django.test import override_settings
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import status
from rest_framework.test import APITestCase

from apps.therapists.models import ClientStory, TherapistProfile
from apps.therapists.password_reset import send_therapist_password_reset_email


@override_settings(ALLOW_TEST_THERAPIST_CREDENTIALS=True)
class TherapistAuthApiTests(APITestCase):
    def setUp(self):
        call_command("bootstrap_wellness_data", with_test_credentials=True)

    def test_verify_passphrase_and_login(self):
        verify_response = self.client.post(
            "/api/v1/auth/verify-passphrase/",
            {"passphrase": "gichia"},
            format="json",
        )
        self.assertEqual(verify_response.status_code, status.HTTP_200_OK)
        self.assertEqual(verify_response.data["email"], "cgichia@gmail.com")

        login_response = self.client.post(
            "/api/v1/auth/login/",
            {
                "email": "cgichia@gmail.com",
                "password": "WellnessHub2026!",
            },
            format="json",
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertIn("access", login_response.data)
        self.assertIn("refresh", login_response.data)
        self.assertIn("bookings", login_response.data)
        self.assertEqual(login_response.data["therapist"]["id"], "caroline-gichia")

        kelvin_login_response = self.client.post(
            "/api/v1/auth/login/",
            {
                "email": "ndemojnrr@gmail.com",
                "password": "Wellness254!",
            },
            format="json",
        )
        self.assertEqual(kelvin_login_response.status_code, status.HTTP_200_OK)
        self.assertEqual(kelvin_login_response.data["therapist"]["id"], "kelvin-kagiri")

        list_response = self.client.get("/api/v1/public/therapists/")
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            [profile["id"] for profile in list_response.data],
            ["caroline-gichia", "kelvin-kagiri"],
        )

    @patch("apps.therapists.views.send_therapist_password_reset_email")
    def test_password_reset_request_is_private_and_sends_registered_email(self, send_reset_email):
        therapist = TherapistProfile.objects.select_related("user").get(public_id="caroline-gichia")
        registered_response = self.client.post(
            "/api/v1/auth/password-reset/request/",
            {"email": "cgichia@gmail.com"},
            format="json",
        )
        unknown_response = self.client.post(
            "/api/v1/auth/password-reset/request/",
            {"email": "not-registered@example.com"},
            format="json",
        )

        self.assertEqual(registered_response.status_code, status.HTTP_200_OK)
        self.assertEqual(unknown_response.status_code, status.HTTP_200_OK)
        self.assertEqual(registered_response.data["detail"], unknown_response.data["detail"])
        send_reset_email.assert_called_once_with(therapist)

    def test_password_reset_confirm_changes_password_and_invalidates_token(self):
        therapist = TherapistProfile.objects.select_related("user").get(public_id="caroline-gichia")
        uid = urlsafe_base64_encode(force_bytes(therapist.user.pk))
        token = default_token_generator.make_token(therapist.user)
        payload = {
            "uid": uid,
            "token": token,
            "nextPassword": "NewWellnessHub2026!",
        }

        response = self.client.post("/api/v1/auth/password-reset/confirm/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        therapist.user.refresh_from_db()
        self.assertTrue(therapist.user.check_password("NewWellnessHub2026!"))

        reused_response = self.client.post("/api/v1/auth/password-reset/confirm/", payload, format="json")
        self.assertEqual(reused_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("invalid or has expired", reused_response.data["detail"])

    def test_password_reset_confirm_rejects_invalid_link(self):
        response = self.client.post(
            "/api/v1/auth/password-reset/confirm/",
            {
                "uid": "invalid",
                "token": "invalid-token",
                "nextPassword": "NewWellnessHub2026!",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @override_settings(
        BREVO_API_KEY="test-brevo-key",
        DEFAULT_FROM_EMAIL="The Wellness Hub <sender@example.com>",
        FRONTEND_BASE_URL="https://wellnesshub.africa",
    )
    @patch("apps.therapists.password_reset.urllib_request.urlopen")
    def test_password_reset_email_uses_brevo_with_secure_frontend_link(self, urlopen):
        therapist = TherapistProfile.objects.select_related("user").get(public_id="caroline-gichia")
        urlopen.return_value.__enter__.return_value = Mock(status=201)

        send_therapist_password_reset_email(therapist)

        request = urlopen.call_args.args[0]
        payload = json.loads(request.data.decode("utf-8"))
        self.assertEqual(payload["sender"]["email"], "sender@example.com")
        self.assertEqual(payload["to"], [{"name": therapist.name, "email": therapist.email}])
        self.assertIn("https://wellnesshub.africa/?therapist_reset_uid=", payload["textContent"])
        self.assertIn("therapist_reset_token=", payload["htmlContent"])


class ClientStoryApiTests(APITestCase):
    def setUp(self):
        call_command("bootstrap_wellness_data", with_test_credentials=True)

    def test_client_can_submit_manual_service_type(self):
        response = self.client.post(
            "/api/v1/stories/",
            {
                "fullName": "Anonymous",
                "serviceType": "Grief and loss",
                "story": "Therapy helped me process a difficult season with more compassion.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["serviceType"], "Grief and loss")
        self.assertEqual(ClientStory.objects.get().service_type, "Grief and loss")
