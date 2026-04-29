from rest_framework import serializers

from .models import Notification


class ContactInquirySerializer(serializers.Serializer):
    name = serializers.CharField(max_length=120, trim_whitespace=True)
    whatsappMobile = serializers.CharField(max_length=40, trim_whitespace=True)
    subject = serializers.CharField(max_length=160, trim_whitespace=True, required=False, allow_blank=True)
    message = serializers.CharField(max_length=2000, trim_whitespace=True)


class NotificationSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source="created_at")

    class Meta:
        model = Notification
        fields = ["id", "type", "title", "description", "createdAt", "read"]
