from django.contrib.auth.models import User
from rest_framework import serializers

from .models import ClientStory, TherapistProfile


class TherapistProfilePublicSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="public_id")
    focusAreas = serializers.CharField(source="focus_areas")
    location = serializers.ListField(source="location_lines", child=serializers.CharField())
    image = serializers.CharField(source="image_url", allow_blank=True)

    class Meta:
        model = TherapistProfile
        fields = [
            "id",
            "name",
            "title",
            "bio",
            "qualifications",
            "approach",
            "experience",
            "focusAreas",
            "specialties",
            "email",
            "phone",
            "location",
            "image",
        ]


class TherapistProfileUpdateSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="public_id", required=False)
    focusAreas = serializers.CharField(source="focus_areas")
    location = serializers.ListField(source="location_lines", child=serializers.CharField())
    image = serializers.CharField(source="image_url", allow_blank=True)

    class Meta:
        model = TherapistProfile
        fields = [
            "id",
            "name",
            "title",
            "bio",
            "qualifications",
            "approach",
            "experience",
            "focusAreas",
            "specialties",
            "email",
            "phone",
            "location",
            "image",
        ]

    def update(self, instance: TherapistProfile, validated_data: dict) -> TherapistProfile:
        previous_name = instance.name
        previous_location = list(instance.location_lines)

        for field, value in validated_data.items():
            setattr(instance, field, value)

        if instance.user.email != instance.email:
            instance.user.email = instance.email
            instance.user.username = instance.email
            instance.user.save(update_fields=["email", "username"])

        instance.save()

        if instance.name != previous_name or instance.location_lines != previous_location:
            from apps.blog.models import BlogPost
            from apps.bookings.models import Booking

            booking_updates: dict[str, str] = {}
            if instance.name != previous_name:
                booking_updates["therapist_name_snapshot"] = instance.name

            if instance.location_lines != previous_location:
                booking_updates["location_summary"] = instance.location_summary

            if booking_updates:
                Booking.objects.filter(
                    therapist=instance,
                    session_type=Booking.SessionType.PHYSICAL,
                ).update(**booking_updates)

            if instance.name != previous_name:
                BlogPost.objects.filter(author=instance, author_name=previous_name).update(author_name=instance.name)

        return instance


class ClientStorySerializer(serializers.ModelSerializer):
    fullName = serializers.CharField(source="full_name", allow_blank=True)
    displayName = serializers.SerializerMethodField()
    image = serializers.CharField(source="image_url", allow_blank=True)
    serviceType = serializers.CharField(source="service_type")
    story = serializers.CharField(source="story_text")
    editedStory = serializers.CharField(source="edited_story_text", allow_blank=True)
    publishedText = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at")
    updatedAt = serializers.DateTimeField(source="updated_at")
    publishedAt = serializers.DateTimeField(source="published_at", allow_null=True)

    class Meta:
        model = ClientStory
        fields = [
            "id",
            "fullName",
            "displayName",
            "image",
            "serviceType",
            "story",
            "editedStory",
            "publishedText",
            "status",
            "createdAt",
            "updatedAt",
            "publishedAt",
        ]

    def get_displayName(self, obj: ClientStory) -> str:
        return obj.display_name

    def get_publishedText(self, obj: ClientStory) -> str:
        return obj.published_text


class ClientStoryCreateSerializer(serializers.ModelSerializer):
    fullName = serializers.CharField(source="full_name", allow_blank=True, required=False, max_length=160)
    image = serializers.CharField(source="image_url", allow_blank=True, required=False)
    serviceType = serializers.ChoiceField(source="service_type", choices=ClientStory.ServiceType.choices)
    story = serializers.CharField(source="story_text", trim_whitespace=True)

    class Meta:
        model = ClientStory
        fields = ["fullName", "image", "serviceType", "story"]


class ClientStoryUpdateSerializer(serializers.ModelSerializer):
    fullName = serializers.CharField(source="full_name", allow_blank=True, required=False, max_length=160)
    image = serializers.CharField(source="image_url", allow_blank=True, required=False)
    serviceType = serializers.ChoiceField(source="service_type", choices=ClientStory.ServiceType.choices, required=False)
    story = serializers.CharField(source="story_text", trim_whitespace=True, required=False)
    editedStory = serializers.CharField(source="edited_story_text", trim_whitespace=True, allow_blank=True, required=False)

    class Meta:
        model = ClientStory
        fields = ["fullName", "image", "serviceType", "story", "editedStory"]


class TherapistSessionSerializer(serializers.Serializer):
    email = serializers.EmailField()
    name = serializers.CharField()
    loggedInAt = serializers.DateTimeField()


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(trim_whitespace=False)


class VerifyPassphraseSerializer(serializers.Serializer):
    passphrase = serializers.CharField(trim_whitespace=True)


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    secretPassphrase = serializers.CharField(trim_whitespace=True)
    nextPassword = serializers.CharField(trim_whitespace=False, min_length=8)


class ChangePasswordSerializer(serializers.Serializer):
    currentPassword = serializers.CharField(trim_whitespace=False)
    nextPassword = serializers.CharField(trim_whitespace=False, min_length=8)


class ChangeSecretPassphraseSerializer(serializers.Serializer):
    currentSecretPassphrase = serializers.CharField(trim_whitespace=True)
    nextSecretPassphrase = serializers.CharField(trim_whitespace=True, min_length=3)


def build_therapist_session(user: User) -> dict:
    return {
        "email": user.email,
        "name": user.therapist_profile.name,
        "loggedInAt": user.last_login,
    }
