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
    inquiry = models.ForeignKey(
        "notifications.ContactInquiry",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="notifications",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.type}: {self.title}"


class ContactInquiry(TimeStampedUUIDModel):
    class Status(models.TextChoices):
        OPEN = "open", "Open"
        REPLIED = "replied", "Replied"

    name = models.CharField(max_length=120)
    email = models.EmailField()
    whatsapp_mobile = models.CharField(max_length=40)
    subject = models.CharField(max_length=160, blank=True)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    replied_by = models.ForeignKey(
        "therapists.TherapistProfile",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="replied_contact_inquiries",
    )
    reply_message = models.TextField(blank=True)
    replied_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.name}: {self.subject or 'General enquiry'}"
