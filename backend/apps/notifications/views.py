import json
from email.utils import parseaddr
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


def unique_emails(values: list[str]) -> list[str]:
    seen: set[str] = set()
    unique: list[str] = []

    for value in values:
        email = value.strip()
        email_key = email.lower()
        if not email or email_key in seen:
            continue

        seen.add(email_key)
        unique.append(email)

    return unique


def get_inquiry_email_recipients(therapists: list[TherapistProfile]) -> tuple[list[str], list[str]]:
    configured_recipient = settings.CONTACT_INQUIRY_RECIPIENT_EMAIL.strip()
    primary_therapist = next(
        (
            therapist
            for therapist in therapists
            if therapist.public_id == "caroline-gichia" or therapist.name.strip().lower() == "caroline gichia"
        ),
        therapists[0] if therapists else None,
    )
    primary_email = primary_therapist.email if primary_therapist else configured_recipient
    recipients = unique_emails([primary_email])
    recipient_keys = {email.lower() for email in recipients}
    cc = unique_emails(
        [
            therapist.email
            for therapist in therapists
            if therapist.email.strip().lower() not in recipient_keys
        ]
    )
    return recipients, cc


def send_inquiry_email_to_therapists(*, inquiry: ContactInquiry, therapists: list[TherapistProfile]) -> None:
    recipients, cc = get_inquiry_email_recipients(therapists)
    if not recipients:
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

    if settings.BREVO_API_KEY:
        sender_name, sender_email = parseaddr(settings.DEFAULT_FROM_EMAIL)
        payload = {
            "sender": {
                "name": sender_name or "The Wellness Hub",
                "email": sender_email,
            },
            "to": [{"email": email} for email in recipients],
            "cc": [{"email": email} for email in cc],
            "replyTo": {
                "name": inquiry.name,
                "email": inquiry.email,
            },
            "subject": subject,
            "textContent": body,
            "htmlContent": html_body,
            "headers": {"X-Auto-Response-Suppress": "All"},
        }
        request = urllib_request.Request(
            settings.BREVO_API_URL,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "accept": "application/json",
                "api-key": settings.BREVO_API_KEY,
                "content-type": "application/json",
            },
            method="POST",
        )

        try:
            with urllib_request.urlopen(request, timeout=settings.BREVO_API_TIMEOUT) as response:
                if response.status not in {200, 201, 202}:
                    raise OSError("Brevo did not accept the contact inquiry email.")
        except (OSError, urllib_error.HTTPError, urllib_error.URLError) as exc:
            raise OSError("Brevo could not deliver the contact inquiry email.") from exc
        return

    message = EmailMultiAlternatives(
        subject=subject,
        body=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=recipients,
        cc=cc,
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
        send_inquiry_email_to_therapists(inquiry=inquiry, therapists=therapists)

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
