from django.contrib import admin

from .models import TherapistProfile


@admin.register(TherapistProfile)
class TherapistProfileAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "title", "is_primary")
    search_fields = ("name", "email", "public_id")
    list_filter = ("is_primary",)
