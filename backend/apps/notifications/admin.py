from django.contrib import admin

from .models import ContactInquiry, Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("title", "type", "therapist", "read", "created_at")
    list_filter = ("type", "read", "created_at")
    search_fields = ("title", "description")


@admin.register(ContactInquiry)
class ContactInquiryAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "subject", "status", "replied_by", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("name", "email", "whatsapp_mobile", "subject", "message", "reply_message")
