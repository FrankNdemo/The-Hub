from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source="created_at")

    class Meta:
        model = Notification
        fields = ["id", "type", "title", "description", "createdAt", "read"]
