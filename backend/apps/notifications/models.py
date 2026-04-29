from django.db import models

from apps.common.models import TimeStampedUUIDModel


class Notification(TimeStampedUUIDModel):
    class NotificationType(models.TextChoices):
        BOOKING = "booking", "Booking"
        RESCHEDULE = "reschedule", "Reschedule"
        CANCEL = "cancel", "Cancel"
        COMPLETION = "completion", "Completion"
        BLOG = "blog", "Blog"
        INQUIRY = "inquiry", "Inquiry"

    therapist = models.ForeignKey(
        "therapists.TherapistProfile",
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    type = models.CharField(max_length=20, choices=NotificationType.choices)
    title = models.CharField(max_length=255)
    description = models.TextField()
    read = models.BooleanField(default=False)
    booking = models.ForeignKey(
        "bookings.Booking",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    blog_post = models.ForeignKey(
        "blog.BlogPost",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="notifications",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.type}: {self.title}"
