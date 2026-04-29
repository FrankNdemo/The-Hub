import json
from urllib import error as urllib_error
from urllib import request as urllib_request

from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.therapists.models import TherapistProfile
from apps.therapists.permissions import IsTherapistAuthenticated

from .models import Notification
from .serializers import ContactInquirySerializer, NotificationSerializer


def normalize_phone(value: str) -> str:
    return "".join(character for character in value if character.isdigit())


def build_inquiry_message(*, name: str, mobile: str, subject: str, message: str) -> str:
    return "\n".join(
        [
            "New Wellness Hub inquiry",
            "",
            f"Name: {name}",
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


class ContactInquiryView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        serializer = ContactInquirySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        name = serializer.validated_data["name"]
        mobile = serializer.validated_data["whatsappMobile"]
        subject = serializer.validated_data.get("subject") or "General enquiry"
        message = serializer.validated_data["message"]
        inquiry_message = build_inquiry_message(name=name, mobile=mobile, subject=subject, message=message)
        therapists = list(TherapistProfile.objects.select_related("user").all())

        if not therapists:
            return Response({"detail": "No therapist profile is available for inquiries."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        whatsapp_sent = send_whatsapp_inquiry(inquiry_message, therapists[0].phone)

        for therapist in therapists:
            Notification.objects.create(
                therapist=therapist,
                type=Notification.NotificationType.INQUIRY,
                title=f"New inquiry from {name}",
                description=inquiry_message,
            )

        return Response({"success": True, "whatsappSent": whatsapp_sent}, status=status.HTTP_201_CREATED)


class TherapistNotificationListView(APIView):
    permission_classes = [IsTherapistAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(therapist=request.user.therapist_profile)
        return Response(NotificationSerializer(notifications, many=True).data)


class MarkNotificationsReadView(APIView):
    permission_classes = [IsTherapistAuthenticated]

    def post(self, request):
        Notification.objects.filter(therapist=request.user.therapist_profile, read=False).update(read=True)
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
