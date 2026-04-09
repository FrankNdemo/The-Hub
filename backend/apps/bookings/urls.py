from django.urls import path

from .views import (
    BookingManageCancelView,
    BookingManageDetailView,
    BookingManageRescheduleView,
    PublicBookingCreateView,
    TherapistBookingCompleteView,
    TherapistBookingDeleteView,
    TherapistBookingListView,
)


urlpatterns = [
    path("bookings/", PublicBookingCreateView.as_view(), name="public-booking-create"),
    path("bookings/manage/<str:token>/", BookingManageDetailView.as_view(), name="booking-manage-detail"),
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
