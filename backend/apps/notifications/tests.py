import json
from unittest.mock import MagicMock, patch

from django.core import mail
from django.core.management import call_command
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from apps.notifications.models import ContactInquiry, Notification


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    DEFAULT_FROM_EMAIL="The Wellness Hub <no-reply@wellnesshub.local>",
    CONTACT_INQUIRY_RECIPIENT_EMAIL="cgichia@gmail.com",
    BREVO_API_KEY="",
    WHATSAPP_CLOUD_API_TOKEN="",
    WHATSAPP_CLOUD_PHONE_NUMBER_ID="",
)
class ContactInquiryApiTests(APITestCase):
    def setUp(self):
        call_command("bootstrap_wellness_data", with_test_credentials=True)

    def test_contact_inquiry_emails_gichia_and_ccs_other_therapists_without_portal_notifications(self):
        response = self.client.post(
            "/api/v1/contact/inquiry/",
            {
                "name": "Inquiry Client",
                "email": "client@example.com",
                "whatsappMobile": "+254700111222",
                "subject": "Support options",
                "message": "I would like to ask about therapy support.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["cgichia@gmail.com"])
        self.assertEqual(mail.outbox[0].cc, ["ndemojnrr@gmail.com"])
        self.assertEqual(mail.outbox[0].reply_to, ["client@example.com"])
        self.assertIn("I would like to ask about therapy support.", mail.outbox[0].body)
        self.assertNotIn("therapist portal", mail.outbox[0].body.lower())

        inquiry = ContactInquiry.objects.get(pk=response.data["inquiryId"])
        self.assertEqual(Notification.objects.filter(inquiry=inquiry).count(), 0)

    @override_settings(CONTACT_INQUIRY_RECIPIENT_EMAIL="legacy-inbox@example.com")
    def test_gichia_remains_primary_recipient_when_legacy_recipient_setting_differs(self):
        response = self.client.post(
            "/api/v1/contact/inquiry/",
            {
                "name": "Primary Recipient Client",
                "email": "primary-client@example.com",
                "whatsappMobile": "+254700333444",
                "subject": "Primary recipient",
                "message": "Please send this to Gichia.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(mail.outbox[0].to, ["cgichia@gmail.com"])
        self.assertEqual(mail.outbox[0].cc, ["ndemojnrr@gmail.com"])
        self.assertNotIn("legacy-inbox@example.com", mail.outbox[0].recipients())

    @override_settings(
        BREVO_API_KEY="test-brevo-key",
        DEFAULT_FROM_EMAIL="The Wellness Hub <verified-sender@example.com>",
    )
    @patch("apps.notifications.views.urllib_request.urlopen")
    def test_contact_inquiry_uses_brevo_with_gichia_to_other_therapist_cc_and_client_reply_to(self, urlopen):
        response_context = MagicMock()
        response_context.status = 201
        urlopen.return_value.__enter__.return_value = response_context

        response = self.client.post(
            "/api/v1/contact/inquiry/",
            {
                "name": "Brevo Client",
                "email": "brevo-client@example.com",
                "whatsappMobile": "+254700555666",
                "subject": "Brevo delivery",
                "message": "Please deliver this contact inquiry.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        request = urlopen.call_args.args[0]
        payload = json.loads(request.data.decode("utf-8"))
        self.assertEqual(payload["sender"]["email"], "verified-sender@example.com")
        self.assertEqual(payload["to"], [{"email": "cgichia@gmail.com"}])
        self.assertEqual(payload["cc"], [{"email": "ndemojnrr@gmail.com"}])
        self.assertEqual(payload["replyTo"]["email"], "brevo-client@example.com")
        self.assertEqual(len(mail.outbox), 0)
