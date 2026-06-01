from django.core import mail
from django.core.management import call_command
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from apps.notifications.models import ContactInquiry, Notification
from apps.therapists.models import TherapistProfile


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    DEFAULT_FROM_EMAIL="The Wellness Hub <no-reply@wellnesshub.local>",
    CONTACT_INQUIRY_RECIPIENT_EMAIL="cgichia@gmail.com",
    WHATSAPP_CLOUD_API_TOKEN="",
    WHATSAPP_CLOUD_PHONE_NUMBER_ID="",
)
class ContactInquiryApiTests(APITestCase):
    def setUp(self):
        call_command("bootstrap_wellness_data", with_test_credentials=True)

    def test_contact_inquiry_emails_main_mailbox_and_creates_team_notifications(self):
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
        self.assertEqual(mail.outbox[0].reply_to, ["client@example.com"])
        self.assertIn("I would like to ask about therapy support.", mail.outbox[0].body)
        self.assertNotIn("therapist portal", mail.outbox[0].body.lower())

        inquiry = ContactInquiry.objects.get(pk=response.data["inquiryId"])
        therapists = TherapistProfile.objects.count()
        self.assertEqual(Notification.objects.filter(inquiry=inquiry).count(), therapists)
        self.assertTrue(
            Notification.objects.filter(
                inquiry=inquiry,
                description__icontains="Check the main email inbox",
            ).exists()
        )

    def test_email_reply_action_marks_inquiry_handled_and_clears_team_notifications(self):
        self.client.post(
            "/api/v1/contact/inquiry/",
            {
                "name": "Reply Client",
                "email": "reply-client@example.com",
                "whatsappMobile": "+254700333444",
                "subject": "Reply me",
                "message": "Please reply by email.",
            },
            format="json",
        )
        inquiry = ContactInquiry.objects.get(email="reply-client@example.com")
        self.assertGreater(Notification.objects.filter(inquiry=inquiry).count(), 1)

        therapist = TherapistProfile.objects.select_related("user").get(public_id="caroline-gichia")
        self.client.force_authenticate(user=therapist.user)
        response = self.client.post(f"/api/v1/dashboard/inquiries/{inquiry.pk}/email-reply/", {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        inquiry.refresh_from_db()
        self.assertEqual(inquiry.status, ContactInquiry.Status.REPLIED)
        self.assertEqual(inquiry.replied_by, therapist)
        self.assertEqual(Notification.objects.filter(inquiry=inquiry).count(), 0)
