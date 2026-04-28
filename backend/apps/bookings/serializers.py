from django.conf import settings
from django.utils import timezone
from rest_framework import serializers

from apps.therapists.models import TherapistProfile

from .delivery import (
    CLIENT_AUDIENCE,
    THERAPIST_AUDIENCE,
    build_google_calendar_add_url,
    build_join_url,
    build_therapist_session_url,
)
from .exploration import get_public_booking_notes, is_exploration_call, is_exploration_call_notes
from .models import Booking, BookingHistoryEvent, BookingPayment, EmailRecord


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


def get_payment_status_label(payment: BookingPayment) -> str:
    return payment.get_status_display()


def get_payment_method_label(payment: BookingPayment) -> str:
    if payment.provider == BookingPayment.Provider.MPESA:
        return "M-Pesa STK Push"

    return payment.get_provider_display()


def get_payment_retry_flag(payment: BookingPayment) -> bool:
    return payment.status in {
        BookingPayment.Status.FAILED,
        BookingPayment.Status.CANCELLED,
        BookingPayment.Status.TIMED_OUT,
        BookingPayment.Status.INSUFFICIENT_FUNDS,
    }


class BookingPaymentSummarySerializer(serializers.ModelSerializer):
    paymentMethod = serializers.SerializerMethodField()
    statusLabel = serializers.SerializerMethodField()
    canRetry = serializers.SerializerMethodField()
    merchantRequestId = serializers.CharField(source="merchant_request_id", allow_blank=True)
    checkoutRequestId = serializers.CharField(source="checkout_request_id", allow_blank=True, allow_null=True)
    transactionId = serializers.CharField(source="transaction_id", allow_blank=True)
    resultCode = serializers.CharField(source="result_code", allow_blank=True)
    resultDescription = serializers.CharField(source="result_description", allow_blank=True)
    phoneNumber = serializers.CharField(source="phone_number")
    createdAt = serializers.DateTimeField(source="created_at")
    updatedAt = serializers.DateTimeField(source="updated_at")
    completedAt = serializers.DateTimeField(source="completed_at", allow_null=True)

    class Meta:
        model = BookingPayment
        fields = [
            "id",
            "provider",
            "paymentMethod",
            "status",
            "statusLabel",
            "canRetry",
            "amount",
            "currency",
            "phoneNumber",
            "merchantRequestId",
            "checkoutRequestId",
            "transactionId",
            "resultCode",
            "resultDescription",
            "createdAt",
            "updatedAt",
            "completedAt",
        ]

    def get_paymentMethod(self, obj: BookingPayment) -> str:
        return get_payment_method_label(obj)

    def get_statusLabel(self, obj: BookingPayment) -> str:
        return get_payment_status_label(obj)

    def get_canRetry(self, obj: BookingPayment) -> bool:
        return get_payment_retry_flag(obj)


class BookingPaymentSerializer(BookingPaymentSummarySerializer):
    bookingId = serializers.CharField(source="booking_id")
    bookingToken = serializers.CharField(source="booking.manage_token")
    clientName = serializers.CharField(source="booking.client_name")
    clientEmail = serializers.EmailField(source="booking.client_email")
    therapistName = serializers.CharField(source="booking.therapist_name_snapshot")
    serviceType = serializers.CharField(source="booking.service_type")
    sessionType = serializers.CharField(source="booking.session_type")
    sessionDate = serializers.DateField(source="booking.date")
    sessionTime = serializers.TimeField(source="booking.time", format="%H:%M")

    class Meta(BookingPaymentSummarySerializer.Meta):
        fields = [
            "bookingId",
            "bookingToken",
            "clientName",
            "clientEmail",
            "therapistName",
            "serviceType",
            "sessionType",
            "sessionDate",
            "sessionTime",
            *BookingPaymentSummarySerializer.Meta.fields,
        ]


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
    therapistSessionUrl = serializers.SerializerMethodField()
    manageUrl = serializers.SerializerMethodField()
    addToCalendarUrl = serializers.SerializerMethodField()
    therapistAddToCalendarUrl = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at")
    updatedAt = serializers.DateTimeField(source="updated_at")
    confirmedAt = serializers.DateTimeField(source="confirmed_at", allow_null=True)
    bookingFeeAmount = serializers.DecimalField(source="booking_fee_amount", max_digits=10, decimal_places=2)
    bookingFeeCurrency = serializers.CharField(source="booking_fee_currency")
    payment = serializers.SerializerMethodField()
    emails = serializers.SerializerMethodField()
    history = BookingHistoryEventSerializer(many=True, read_only=True)
    time = serializers.TimeField(format="%H:%M")
    notes = serializers.SerializerMethodField()
    isExplorationCall = serializers.SerializerMethodField()

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
            "therapistSessionUrl",
            "manageUrl",
            "addToCalendarUrl",
            "therapistAddToCalendarUrl",
            "createdAt",
            "updatedAt",
            "confirmedAt",
            "bookingFeeAmount",
            "bookingFeeCurrency",
            "payment",
            "notes",
            "isExplorationCall",
            "emails",
            "history",
        ]

    def get_manageUrl(self, obj: Booking) -> str:
        return f"{settings.FRONTEND_BASE_URL}/manage/{obj.manage_token}"

    def get_joinUrl(self, obj: Booking) -> str:
        if obj.session_type != Booking.SessionType.VIRTUAL or is_exploration_call(obj):
            return ""

        return build_join_url(obj.manage_token)

    def get_therapistSessionUrl(self, obj: Booking) -> str:
        if (
            not self.context.get("include_therapist_links")
            or obj.session_type != Booking.SessionType.VIRTUAL
            or is_exploration_call(obj)
        ):
            return ""

        return build_therapist_session_url(obj)

    def get_meetLink(self, obj: Booking) -> str:
        if not self.context.get("include_meet_link"):
            return ""

        return obj.meet_link

    def get_addToCalendarUrl(self, obj: Booking) -> str:
        if is_exploration_call(obj):
            return ""

        audience = self.context.get("audience", CLIENT_AUDIENCE)
        return build_google_calendar_add_url(obj, audience)

    def get_therapistAddToCalendarUrl(self, obj: Booking) -> str:
        if not self.context.get("include_therapist_links") or is_exploration_call(obj):
            return ""

        return build_google_calendar_add_url(obj, THERAPIST_AUDIENCE)

    def get_notes(self, obj: Booking) -> str:
        return get_public_booking_notes(obj.notes)

    def get_isExplorationCall(self, obj: Booking) -> bool:
        return is_exploration_call(obj)

    def get_emails(self, obj: Booking) -> list[dict]:
        if not self.context.get("include_email_records"):
            return []

        return EmailRecordSerializer(obj.emails.all(), many=True).data

    def get_payment(self, obj: Booking) -> dict | None:
        payments = list(obj.payments.all())
        if not payments:
            return None

        return BookingPaymentSummarySerializer(payments[0]).data


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
    isExplorationCall = serializers.SerializerMethodField()

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
            "isExplorationCall",
        ]

    def get_meetLink(self, obj: Booking) -> str:
        if is_exploration_call(obj):
            return ""

        if self.context.get("therapist_access_verified"):
            return obj.meet_link

        if not self.context.get("access_verified") or not is_virtual_session_open(obj):
            return ""

        return obj.meet_link

    def get_joinUrl(self, obj: Booking) -> str:
        if obj.session_type != Booking.SessionType.VIRTUAL or is_exploration_call(obj):
            return ""

        return build_join_url(obj.manage_token)

    def get_manageUrl(self, obj: Booking) -> str:
        return f"{settings.FRONTEND_BASE_URL}/manage/{obj.manage_token}"

    def get_addToCalendarUrl(self, obj: Booking) -> str:
        if is_exploration_call(obj):
            return ""

        audience = self.context.get("audience", CLIENT_AUDIENCE)
        return build_google_calendar_add_url(obj, audience)

    def get_canJoinSession(self, obj: Booking) -> bool:
        if is_exploration_call(obj):
            return False

        if self.context.get("therapist_access_verified"):
            return bool(obj.meet_link)

        return bool(self.context.get("access_verified")) and is_virtual_session_open(obj) and bool(obj.meet_link)

    def get_isExplorationCall(self, obj: Booking) -> bool:
        return is_exploration_call(obj)


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


class BookingCheckoutSerializer(BookingCreateSerializer):
    mpesaPhoneNumber = serializers.CharField(max_length=32)

    def validate(self, attrs):
        attrs = super().validate(attrs)
        if is_exploration_call_notes(attrs.get("notes", "")):
            raise serializers.ValidationError({"notes": "Exploration call requests do not use the paid booking flow."})
        return attrs


class BookingPaymentRetrySerializer(serializers.Serializer):
    bookingToken = serializers.CharField()
    mpesaPhoneNumber = serializers.CharField(max_length=32)


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
