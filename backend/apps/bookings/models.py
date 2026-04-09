from django.db import models

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
    meet_link = models.URLField(blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self) -> str:
        return f"{self.client_name} - {self.date} {self.time}"


class BookingHistoryEvent(TimeStampedUUIDModel):
    class EventType(models.TextChoices):
        CREATED = "created", "Created"
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
