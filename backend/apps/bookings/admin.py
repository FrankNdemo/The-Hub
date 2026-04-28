from django.contrib import admin

from .models import Booking, BookingHistoryEvent, BookingPayment, EmailRecord


class BookingHistoryInline(admin.TabularInline):
    model = BookingHistoryEvent
    extra = 0
    readonly_fields = ("type", "title", "description", "created_at", "updated_at")


class EmailRecordInline(admin.TabularInline):
    model = EmailRecord
    extra = 0
    readonly_fields = ("kind", "subject", "recipients", "created_at", "updated_at")


class BookingPaymentInline(admin.TabularInline):
    model = BookingPayment
    extra = 0
    readonly_fields = (
        "provider",
        "status",
        "amount",
        "currency",
        "phone_number",
        "transaction_id",
        "merchant_request_id",
        "checkout_request_id",
        "result_code",
        "result_description",
        "created_at",
        "updated_at",
        "completed_at",
    )


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ("client_name", "therapist_name_snapshot", "date", "time", "service_type", "session_type", "status")
    list_filter = ("status", "service_type", "session_type", "date")
    search_fields = ("client_name", "client_email", "manage_token", "therapist_name_snapshot")
    inlines = [BookingHistoryInline, EmailRecordInline, BookingPaymentInline]
