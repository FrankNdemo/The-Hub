from django.conf import settings
from rest_framework import serializers

from apps.therapists.models import TherapistProfile

from .models import Booking, BookingHistoryEvent, EmailRecord


class EmailRecordSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source="created_at")

    class Meta:
        model = EmailRecord
        fields = ["id", "kind", "subject", "recipients", "html", "createdAt"]


class BookingHistoryEventSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source="created_at")

    class Meta:
        model = BookingHistoryEvent
        fields = ["id", "type", "title", "description", "createdAt"]


class BookingDetailSerializer(serializers.ModelSerializer):
    token = serializers.CharField(source="manage_token")
    clientName = serializers.CharField(source="client_name")
    clientEmail = serializers.EmailField(source="client_email")
    clientPhone = serializers.CharField(source="client_phone")
    therapistId = serializers.CharField(source="therapist.public_id")
    therapistName = serializers.CharField(source="therapist_name_snapshot")
    serviceType = serializers.CharField(source="service_type")
    participantCount = serializers.IntegerField(source="participant_count", allow_null=True)
    sessionType = serializers.CharField(source="session_type")
    locationSummary = serializers.CharField(source="location_summary")
    calendarEventId = serializers.CharField(source="calendar_event_id")
    meetLink = serializers.CharField(source="meet_link", allow_blank=True)
    manageUrl = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at")
    updatedAt = serializers.DateTimeField(source="updated_at")
    emails = EmailRecordSerializer(many=True, read_only=True)
    history = BookingHistoryEventSerializer(many=True, read_only=True)
    time = serializers.TimeField(format="%H:%M")

    class Meta:
        model = Booking
        fields = [
            "id",
            "token",
            "clientName",
            "clientEmail",
            "clientPhone",
            "therapistId",
            "therapistName",
            "serviceType",
            "participantCount",
            "sessionType",
            "date",
            "time",
            "status",
            "locationSummary",
            "calendarEventId",
            "meetLink",
            "manageUrl",
            "createdAt",
            "updatedAt",
            "notes",
            "emails",
            "history",
        ]

    def get_manageUrl(self, obj: Booking) -> str:
        return f"{settings.FRONTEND_BASE_URL}/manage/{obj.manage_token}"


class BookingCreateSerializer(serializers.Serializer):
    clientName = serializers.CharField(source="client_name", max_length=255)
    clientEmail = serializers.EmailField(source="client_email")
    clientPhone = serializers.CharField(source="client_phone", max_length=64)
    therapistId = serializers.SlugRelatedField(
        source="therapist",
        slug_field="public_id",
        queryset=TherapistProfile.objects.all(),
    )
    date = serializers.DateField()
    time = serializers.TimeField(input_formats=["%H:%M", "%H:%M:%S"])
    serviceType = serializers.ChoiceField(source="service_type", choices=Booking.ServiceType.choices)
    participantCount = serializers.IntegerField(
        source="participant_count",
        required=False,
        allow_null=True,
        min_value=1,
    )
    sessionType = serializers.ChoiceField(source="session_type", choices=Booking.SessionType.choices)
    notes = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        service_type = attrs["service_type"]
        participant_count = attrs.get("participant_count")
        if service_type == Booking.ServiceType.CORPORATE and not participant_count:
            raise serializers.ValidationError({"participantCount": "Participant count is required for corporate wellness."})
        if service_type != Booking.ServiceType.CORPORATE:
            attrs["participant_count"] = None
        return attrs


class BookingRescheduleSerializer(serializers.Serializer):
    date = serializers.DateField()
    time = serializers.TimeField(input_formats=["%H:%M", "%H:%M:%S"])


class BookingDeleteSerializer(serializers.Serializer):
    reason = serializers.CharField(max_length=500)

    def validate_reason(self, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Please provide a reason before deleting this session.")
        return cleaned
