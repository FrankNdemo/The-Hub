from django.urls import path

from .views import (
    BookingJoinDetailView,
    BookingManageCancelView,
    BookingManageDetailView,
    BookingManageRescheduleView,
    BookingReminderRunView,
    BookingTherapistSessionDetailView,
    MpesaCallbackView,
    PublicBookingCreateView,
    PublicBookingCheckoutRetryView,
    PublicBookingCheckoutView,
    PublicBookingPrecheckView,
    PublicBookingPaymentStatusView,
    TherapistBookingCompleteView,
    TherapistBookingDeleteView,
    TherapistBookingListView,
)


urlpatterns = [
    path("bookings/", PublicBookingCreateView.as_view(), name="public-booking-create"),
    path("bookings/precheck/", PublicBookingPrecheckView.as_view(), name="public-booking-precheck"),
    path("bookings/checkout/", PublicBookingCheckoutView.as_view(), name="public-booking-checkout"),
    path("bookings/checkout/retry/", PublicBookingCheckoutRetryView.as_view(), name="public-booking-checkout-retry"),
    path(
        "bookings/checkout/<str:token>/payments/<uuid:payment_id>/status/",
        PublicBookingPaymentStatusView.as_view(),
        name="public-booking-payment-status",
    ),
    path("bookings/join/<str:token>/", BookingJoinDetailView.as_view(), name="booking-join-detail"),
    path(
        "bookings/therapist-session/<str:token>/",
        BookingTherapistSessionDetailView.as_view(),
        name="booking-therapist-session-detail",
    ),
    path("bookings/manage/<str:token>/", BookingManageDetailView.as_view(), name="booking-manage-detail"),
    path("bookings/reminders/run/", BookingReminderRunView.as_view(), name="booking-reminder-run"),
    path(
        "bookings/manage/<str:token>/reschedule/",
        BookingManageRescheduleView.as_view(),
        name="booking-manage-reschedule",
    ),
    path(
        "bookings/manage/<str:token>/cancel/",
        BookingManageCancelView.as_view(),
        name="booking-manage-cancel",
    ),
    path("payments/mpesa/callback/", MpesaCallbackView.as_view(), name="mpesa-callback"),
    path("dashboard/bookings/", TherapistBookingListView.as_view(), name="dashboard-booking-list"),
    path(
        "dashboard/bookings/<uuid:pk>/complete/",
        TherapistBookingCompleteView.as_view(),
        name="dashboard-booking-complete",
    ),
    path(
        "dashboard/bookings/<uuid:pk>/delete/",
        TherapistBookingDeleteView.as_view(),
        name="dashboard-booking-delete",
    ),
]
