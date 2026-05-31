from rest_framework import serializers

from .models import ContactInquiry, Notification


class ContactInquirySerializer(serializers.Serializer):
    name = serializers.CharField(max_length=120, trim_whitespace=True)
    email = serializers.EmailField()
    whatsappMobile = serializers.CharField(max_length=40, trim_whitespace=True)
    subject = serializers.CharField(max_length=160, trim_whitespace=True, required=False, allow_blank=True)
    message = serializers.CharField(max_length=2000, trim_whitespace=True)


class ContactInquiryReplySerializer(serializers.Serializer):
    replyMessage = serializers.CharField(max_length=4000, trim_whitespace=True)


class ContactInquiryNotificationSerializer(serializers.ModelSerializer):
    whatsappMobile = serializers.CharField(source="whatsapp_mobile")
    createdAt = serializers.DateTimeField(source="created_at")
    repliedAt = serializers.DateTimeField(source="replied_at", allow_null=True)
    repliedBy = serializers.CharField(source="replied_by.name", allow_null=True)
    replyMessage = serializers.CharField(source="reply_message")

    class Meta:
        model = ContactInquiry
        fields = [
            "id",
            "name",
            "email",
            "whatsappMobile",
            "subject",
            "message",
            "status",
            "replyMessage",
            "repliedBy",
            "repliedAt",
            "createdAt",
        ]


class NotificationSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source="created_at")
    inquiry = ContactInquiryNotificationSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = ["id", "type", "title", "description", "createdAt", "read", "inquiry"]
