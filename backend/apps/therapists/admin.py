from django.contrib import admin

from .models import ClientStory, TherapistProfile


@admin.register(TherapistProfile)
class TherapistProfileAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "title", "is_primary")
    search_fields = ("name", "email", "public_id")
    list_filter = ("is_primary",)


@admin.register(ClientStory)
class ClientStoryAdmin(admin.ModelAdmin):
    list_display = ("display_name", "service_type", "status", "therapist", "created_at", "published_at")
    list_filter = ("status", "service_type", "therapist")
    search_fields = ("full_name", "story_text", "edited_story_text")
    readonly_fields = ("created_at", "updated_at")
