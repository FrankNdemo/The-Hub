from django.conf import settings
from django.utils import timezone
from rest_framework import serializers

from apps.therapists.models import TherapistProfile

from .delivery import CLIENT_AUDIENCE, THERAPIST_AUDIENCE, build_google_calendar_add_url, build_join_url
from .models import Booking, BookingHistoryEvent, EmailRecord


def is_virtual_session_open(booking: Booking) -> bool:
    return (
        booking.session_type == Booking.SessionType.VIRTUAL
        and booking.status not in {Booking.Status.CANCELLED, Booking.Status.COMPLETED}
        and timezone.localdate() >= booking.date
    )


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
    meetLink = serializers.SerializerMethodField()
    joinUrl = serializers.SerializerMethodField()
    manageUrl = serializers.SerializerMethodField()
    addToCalendarUrl = serializers.SerializerMethodField()
    therapistAddToCalendarUrl = serializers.SerializerMethodField()
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
            "joinUrl",
            "manageUrl",
            "addToCalendarUrl",
            "therapistAddToCalendarUrl",
            "createdAt",
            "updatedAt",
            "notes",
            "emails",
            "history",
        ]

    def get_manageUrl(self, obj: Booking) -> str:
        return f"{settings.FRONTEND_BASE_URL}/manage/{obj.manage_token}"

    def get_joinUrl(self, obj: Booking) -> str:
        if obj.session_type != Booking.SessionType.VIRTUAL:
            return ""

        return build_join_url(obj.manage_token)

    def get_meetLink(self, obj: Booking) -> str:
        if not self.context.get("include_meet_link"):
            return ""

        return obj.meet_link

    def get_addToCalendarUrl(self, obj: Booking) -> str:
        audience = self.context.get("audience", CLIENT_AUDIENCE)
        return build_google_calendar_add_url(obj, audience)

    def get_therapistAddToCalendarUrl(self, obj: Booking) -> str:
        return build_google_calendar_add_url(obj, THERAPIST_AUDIENCE)


class BookingJoinSerializer(serializers.ModelSerializer):
    token = serializers.CharField(source="manage_token")
    therapistName = serializers.CharField(source="therapist_name_snapshot")
    serviceType = serializers.CharField(source="service_type")
    sessionType = serializers.CharField(source="session_type")
    locationSummary = serializers.CharField(source="location_summary")
    meetLink = serializers.SerializerMethodField()
    joinUrl = serializers.SerializerMethodField()
    manageUrl = serializers.SerializerMethodField()
    addToCalendarUrl = serializers.SerializerMethodField()
    canJoinSession = serializers.SerializerMethodField()
    time = serializers.TimeField(format="%H:%M")

    class Meta:
        model = Booking
        fields = [
            "token",
            "therapistName",
            "serviceType",
            "sessionType",
            "date",
            "time",
            "status",
            "locationSummary",
            "meetLink",
            "joinUrl",
            "manageUrl",
            "addToCalendarUrl",
            "canJoinSession",
        ]

    def get_meetLink(self, obj: Booking) -> str:
        if not self.context.get("access_verified") or not is_virtual_session_open(obj):
            return ""

        return obj.meet_link

    def get_joinUrl(self, obj: Booking) -> str:
        if obj.session_type != Booking.SessionType.VIRTUAL:
            return ""

        return build_join_url(obj.manage_token)

    def get_manageUrl(self, obj: Booking) -> str:
        return f"{settings.FRONTEND_BASE_URL}/manage/{obj.manage_token}"

    def get_addToCalendarUrl(self, obj: Booking) -> str:
        audience = self.context.get("audience", CLIENT_AUDIENCE)
        return build_google_calendar_add_url(obj, audience)

    def get_canJoinSession(self, obj: Booking) -> bool:
        return bool(self.context.get("access_verified")) and is_virtual_session_open(obj) and bool(obj.meet_link)


class BookingAccessSerializer(serializers.Serializer):
    email = serializers.EmailField()


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
    clientEmail = serializers.EmailField()


class BookingDeleteSerializer(serializers.Serializer):
    reason = serializers.CharField(max_length=500)

    def validate_reason(self, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Please provide a reason before deleting this session.")
        return cleaned
