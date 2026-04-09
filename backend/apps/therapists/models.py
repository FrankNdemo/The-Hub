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
