from django.contrib.auth.hashers import check_password, make_password
from django.contrib.auth.models import User
from django.db import models

from apps.common.models import TimeStampedUUIDModel


class TherapistProfile(TimeStampedUUIDModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="therapist_profile")
    public_id = models.SlugField(max_length=120, unique=True)
    name = models.CharField(max_length=255)
    title = models.CharField(max_length=255)
    bio = models.TextField(blank=True)
    qualifications = models.CharField(max_length=255, blank=True)
    approach = models.CharField(max_length=255, blank=True)
    experience = models.TextField(blank=True)
    focus_areas = models.TextField(blank=True)
    specialties = models.JSONField(default=list, blank=True)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=64, blank=True)
    location_lines = models.JSONField(default=list, blank=True)
    image_url = models.TextField(blank=True)
    secret_passphrase_hash = models.CharField(max_length=255)
    is_primary = models.BooleanField(default=False)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name

    def set_secret_passphrase(self, raw_secret: str) -> None:
        self.secret_passphrase_hash = make_password(raw_secret.strip())

    def check_secret_passphrase(self, raw_secret: str) -> bool:
        return check_password(raw_secret.strip(), self.secret_passphrase_hash)

    @property
    def location_summary(self) -> str:
        return ", ".join(self.location_lines)


class ClientStory(TimeStampedUUIDModel):
    class ServiceType(models.TextChoices):
        INDIVIDUAL = "individual", "Individual Therapy"
        FAMILY = "family", "Family Therapy"
        CORPORATE = "corporate", "Corporate Wellness"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending Review"
        REVIEWED = "reviewed", "Reviewed"
        PUBLISHED = "published", "Published"

    therapist = models.ForeignKey(
        TherapistProfile,
        on_delete=models.CASCADE,
        related_name="client_stories",
    )
    full_name = models.CharField(max_length=160, blank=True)
    image_url = models.TextField(blank=True)
    service_type = models.CharField(
        max_length=20,
        choices=ServiceType.choices,
        default=ServiceType.INDIVIDUAL,
    )
    story_text = models.TextField()
    edited_story_text = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.display_name

    @property
    def display_name(self) -> str:
        return self.full_name.strip() or "Anonymous client"

    @property
    def published_text(self) -> str:
        return self.edited_story_text.strip() or self.story_text
