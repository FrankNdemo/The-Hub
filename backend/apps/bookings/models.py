from decimal import Decimal

from django.db import models
from django.utils import timezone

from apps.common.models import TimeStampedUUIDModel


class Booking(TimeStampedUUIDModel):
    class SessionType(models.TextChoices):
        VIRTUAL = "virtual", "Virtual"
        PHYSICAL = "physical", "Physical"

    class ServiceType(models.TextChoices):
        INDIVIDUAL = "individual", "Individual"
        FAMILY = "family", "Family"
        CORPORATE = "corporate", "Corporate"

    class Status(models.TextChoices):
        PAYMENT_PENDING = "payment_pending", "Payment Pending"
        PAYMENT_FAILED = "payment_failed", "Payment Failed"
        UPCOMING = "upcoming", "Upcoming"
        RESCHEDULED = "rescheduled", "Rescheduled"
        CANCELLED = "cancelled", "Cancelled"
        COMPLETED = "completed", "Completed"

    manage_token = models.CharField(max_length=48, unique=True, db_index=True)
    client_name = models.CharField(max_length=255)
    client_email = models.EmailField()
    client_phone = models.CharField(max_length=64)
    therapist = models.ForeignKey(
        "therapists.TherapistProfile",
        on_delete=models.PROTECT,
        related_name="bookings",
    )
    therapist_name_snapshot = models.CharField(max_length=255)
    service_type = models.CharField(max_length=20, choices=ServiceType.choices)
    participant_count = models.PositiveIntegerField(null=True, blank=True)
    session_type = models.CharField(max_length=20, choices=SessionType.choices)
    date = models.DateField()
    time = models.TimeField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.UPCOMING)
    location_summary = models.TextField()
    calendar_event_id = models.CharField(max_length=255, blank=True)
    meet_link = models.URLField(blank=True, max_length=2048)
    booking_fee_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("200.00"))
    booking_fee_currency = models.CharField(max_length=8, default="KES")
    payment_expires_at = models.DateTimeField(null=True, blank=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted_reason = models.TextField(blank=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self) -> str:
        return f"{self.client_name} - {self.date} {self.time}"

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None

    def mark_deleted(self, *, reason: str) -> None:
        self.deleted_reason = reason.strip()
        self.deleted_at = timezone.now()

    def has_active_payment_hold(self, now=None) -> bool:
        current_time = now or timezone.now()
        return (
            self.status == self.Status.PAYMENT_PENDING
            and self.payment_expires_at is not None
            and self.payment_expires_at > current_time
        )


class BookingHistoryEvent(TimeStampedUUIDModel):
    class EventType(models.TextChoices):
        CREATED = "created", "Created"
        PAYMENT_INITIATED = "payment_initiated", "Payment Initiated"
        PAYMENT_FAILED = "payment_failed", "Payment Failed"
        RESCHEDULED = "rescheduled", "Rescheduled"
        CANCELLED = "cancelled", "Cancelled"
        COMPLETED = "completed", "Completed"

    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name="history")
    type = models.CharField(max_length=20, choices=EventType.choices)
    title = models.CharField(max_length=255)
    description = models.TextField()

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.booking.client_name}: {self.title}"


class EmailRecord(TimeStampedUUIDModel):
    class EmailKind(models.TextChoices):
        CONFIRMATION = "confirmation", "Confirmation"
        RESCHEDULE = "reschedule", "Reschedule"
        CANCELLATION = "cancellation", "Cancellation"

    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name="emails")
    kind = models.CharField(max_length=20, choices=EmailKind.choices)
    subject = models.CharField(max_length=255)
    recipients = models.JSONField(default=list, blank=True)
    html = models.TextField()

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.kind}: {self.subject}"


class BookingPayment(TimeStampedUUIDModel):
    class Provider(models.TextChoices):
        MPESA = "mpesa", "M-Pesa"

    class Status(models.TextChoices):
        INITIATED = "initiated", "Initiated"
        STK_PUSH_SENT = "stk_push_sent", "STK Push Sent"
        PROCESSING = "processing", "Processing"
        SUCCESS = "success", "Success"
        FAILED = "failed", "Failed"
        CANCELLED = "cancelled", "Cancelled"
        TIMED_OUT = "timed_out", "Timed Out"
        INSUFFICIENT_FUNDS = "insufficient_funds", "Insufficient Funds"

    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name="payments")
    provider = models.CharField(max_length=20, choices=Provider.choices, default=Provider.MPESA)
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.INITIATED)
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("200.00"))
    currency = models.CharField(max_length=8, default="KES")
    phone_number = models.CharField(max_length=32)
    account_reference = models.CharField(max_length=64, blank=True)
    merchant_request_id = models.CharField(max_length=128, blank=True, db_index=True)
    checkout_request_id = models.CharField(max_length=128, blank=True, null=True, unique=True)
    result_code = models.CharField(max_length=32, blank=True)
    result_description = models.TextField(blank=True)
    transaction_id = models.CharField(max_length=128, blank=True)
    callback_received_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    last_status_check_at = models.DateTimeField(null=True, blank=True)
    request_payload = models.JSONField(default=dict, blank=True)
    response_payload = models.JSONField(default=dict, blank=True)
    callback_payload = models.JSONField(default=dict, blank=True)
    query_payload = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.booking.client_name} - {self.get_status_display()} - {self.amount} {self.currency}"

    @property
    def is_final(self) -> bool:
        return self.status in {
            self.Status.SUCCESS,
            self.Status.FAILED,
            self.Status.CANCELLED,
            self.Status.TIMED_OUT,
            self.Status.INSUFFICIENT_FUNDS,
        }
