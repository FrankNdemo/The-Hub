import json
from urllib.parse import quote
from urllib import error as urllib_error
from urllib import request as urllib_request

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.db import transaction
from django.utils import html, timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.therapists.models import TherapistProfile
from apps.therapists.permissions import IsTherapistAuthenticated
from apps.bookings.retention import delete_stale_read_notifications

from .models import ContactInquiry, Notification
from .serializers import ContactInquirySerializer, NotificationSerializer


def normalize_phone(value: str) -> str:
    return "".join(character for character in value if character.isdigit())


def build_inquiry_message(*, name: str, email: str, mobile: str, subject: str, message: str) -> str:
    return "\n".join(
        [
            "New Wellness Hub inquiry",
            "",
            f"Name: {name}",
            f"Email: {email}",
            f"WhatsApp mobile: {mobile}",
            f"Subject: {subject}",
            "",
            "Message:",
            message,
        ]
    )


def send_whatsapp_inquiry(message: str, fallback_phone: str) -> bool:
    if not settings.WHATSAPP_CLOUD_API_TOKEN or not settings.WHATSAPP_CLOUD_PHONE_NUMBER_ID:
        return False

    recipient = normalize_phone(settings.WHATSAPP_INQUIRY_RECIPIENT or fallback_phone)
    if not recipient:
        return False

    payload = {
        "messaging_product": "whatsapp",
        "to": recipient,
        "type": "text",
        "text": {
            "preview_url": False,
            "body": message,
        },
    }
    request = urllib_request.Request(
        f"{settings.WHATSAPP_CLOUD_API_URL}/{settings.WHATSAPP_CLOUD_PHONE_NUMBER_ID}/messages",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {settings.WHATSAPP_CLOUD_API_TOKEN}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib_request.urlopen(request, timeout=settings.WHATSAPP_API_TIMEOUT) as response:
            return response.status in {200, 201, 202}
    except (OSError, urllib_error.HTTPError, urllib_error.URLError):
        return False


def build_inquiry_email_html(*, inquiry: ContactInquiry) -> str:
    safe_subject = html.escape(inquiry.subject or "General enquiry")
    safe_message = html.escape(inquiry.message).replace("\n", "<br />")
    safe_client_email = html.escape(inquiry.email)
    reply_subject = f"Re: {inquiry.subject or 'Your inquiry'}"
    mailto_url = f"mailto:{quote(inquiry.email)}?subject={quote(reply_subject)}"
    return f"""<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#f5f3ec;font-family:Arial,sans-serif;color:#23483d;">
    <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #dfe9e3;padding:28px;">
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#6f8f82;">The Wellness Hub</p>
      <h1 style="margin:0 0 18px;font-size:28px;line-height:34px;color:#23483d;">New contact inquiry</h1>
      <p style="margin:0 0 20px;font-size:15px;line-height:25px;color:#4c695f;">A client sent a message through the contact page. Reply directly from this mailbox when ready.</p>
      <div style="background:#f7fbf8;border:1px solid #dfe9e3;padding:16px;margin-bottom:14px;">
        <strong>Client</strong><br />{html.escape(inquiry.name)}<br />{safe_client_email}<br />{html.escape(inquiry.whatsapp_mobile)}
      </div>
      <div style="background:#f7fbf8;border:1px solid #dfe9e3;padding:16px;margin-bottom:14px;">
        <strong>Subject</strong><br />{safe_subject}
      </div>
      <div style="background:#f7fbf8;border:1px solid #dfe9e3;padding:16px;margin-bottom:22px;">
        <strong>Message</strong><br />{safe_message}
      </div>
      <a href="{mailto_url}" style="display:inline-block;background:#4e7c68;color:#ffffff;text-decoration:none;padding:13px 20px;font-weight:700;">Reply by email</a>
    </div>
  </body>
</html>"""


def send_inquiry_email_to_main_mailbox(*, inquiry: ContactInquiry) -> None:
    recipient = settings.CONTACT_INQUIRY_RECIPIENT_EMAIL.strip()
    if not recipient:
        return

    subject = f"New Contact Inquiry: {inquiry.subject or 'General enquiry'} | The Wellness Hub"
    body = "\n".join(
        [
            "The Wellness Hub",
            "",
            "New contact inquiry",
            "",
            f"Name: {inquiry.name}",
            f"Email: {inquiry.email}",
            f"WhatsApp mobile: {inquiry.whatsapp_mobile}",
            f"Subject: {inquiry.subject or 'General enquiry'}",
            "",
            "Message:",
            inquiry.message,
            "",
            f"Reply directly to the client at {inquiry.email}.",
        ]
    )
    html_body = build_inquiry_email_html(inquiry=inquiry)
    message = EmailMultiAlternatives(
        subject=subject,
        body=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[recipient],
        reply_to=[inquiry.email],
        headers={"X-Auto-Response-Suppress": "All"},
    )
    message.attach_alternative(html_body, "text/html")
    message.send(fail_silently=False)


class ContactInquiryView(APIView):
    permission_classes = []
    authentication_classes = []

    @transaction.atomic
    def post(self, request):
        serializer = ContactInquirySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        name = serializer.validated_data["name"]
        email = serializer.validated_data["email"]
        mobile = serializer.validated_data["whatsappMobile"]
        subject = serializer.validated_data.get("subject") or "General enquiry"
        message = serializer.validated_data["message"]
        therapists = list(TherapistProfile.objects.select_related("user").all())

        if not therapists:
            return Response({"detail": "No therapist profile is available for inquiries."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        inquiry = ContactInquiry.objects.create(
            name=name,
            email=email,
            whatsapp_mobile=mobile,
            subject=subject,
            message=message,
        )
        inquiry_message = build_inquiry_message(name=name, email=email, mobile=mobile, subject=subject, message=message)
        whatsapp_sent = send_whatsapp_inquiry(inquiry_message, therapists[0].phone)
        send_inquiry_email_to_main_mailbox(inquiry=inquiry)

        for therapist in therapists:
            Notification.objects.create(
                therapist=therapist,
                type=Notification.NotificationType.INQUIRY,
                title=f"New inquiry from {name}",
                description="Check the main email inbox for this inquiry message. Use the email reply action when you are ready to respond.",
                inquiry=inquiry,
            )

        return Response({"success": True, "whatsappSent": whatsapp_sent, "inquiryId": str(inquiry.pk)}, status=status.HTTP_201_CREATED)


class TherapistNotificationListView(APIView):
    permission_classes = [IsTherapistAuthenticated]

    def get(self, request):
        delete_stale_read_notifications(therapist=request.user.therapist_profile)
        notifications = Notification.objects.filter(therapist=request.user.therapist_profile).select_related("inquiry", "inquiry__replied_by")
        return Response(NotificationSerializer(notifications, many=True).data)


class ContactInquiryEmailReplyView(APIView):
    permission_classes = [IsTherapistAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        therapist = request.user.therapist_profile
        inquiry = ContactInquiry.objects.select_for_update().filter(pk=pk).first()
        if not inquiry:
            return Response({"detail": "Inquiry not found."}, status=status.HTTP_404_NOT_FOUND)

        notification = Notification.objects.filter(therapist=therapist, inquiry=inquiry).first()
        if not notification:
            return Response({"detail": "This inquiry is not assigned to your dashboard."}, status=status.HTTP_403_FORBIDDEN)

        if inquiry.status != ContactInquiry.Status.REPLIED:
            inquiry.status = ContactInquiry.Status.REPLIED
            inquiry.replied_by = therapist
            inquiry.reply_message = "Reply opened in email."
            inquiry.replied_at = timezone.now()
            inquiry.save(update_fields=["status", "replied_by", "reply_message", "replied_at", "updated_at"])

        Notification.objects.filter(inquiry=inquiry).delete()
        return Response({"success": True})


class MarkNotificationsReadView(APIView):
    permission_classes = [IsTherapistAuthenticated]

    def post(self, request):
        Notification.objects.filter(therapist=request.user.therapist_profile, read=False).update(
            read=True,
            updated_at=timezone.now(),
        )
        return Response({"success": True})


class NotificationDeleteView(APIView):
    permission_classes = [IsTherapistAuthenticated]

    def delete(self, request, pk):
        notification = Notification.objects.filter(
            therapist=request.user.therapist_profile,
            pk=pk,
        ).first()
        if not notification:
            return Response({"detail": "Notification not found."}, status=status.HTTP_404_NOT_FOUND)

        notification.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
