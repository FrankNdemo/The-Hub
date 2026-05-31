from django.urls import path

from .views import (
    ContactInquiryReplyView,
    ContactInquiryView,
    MarkNotificationsReadView,
    NotificationDeleteView,
    TherapistNotificationListView,
)


urlpatterns = [
    path("contact/inquiry/", ContactInquiryView.as_view(), name="contact-inquiry"),
    path("dashboard/inquiries/<uuid:pk>/reply/", ContactInquiryReplyView.as_view(), name="dashboard-inquiry-reply"),
    path("dashboard/notifications/", TherapistNotificationListView.as_view(), name="dashboard-notification-list"),
    path(
        "dashboard/notifications/mark-read/",
        MarkNotificationsReadView.as_view(),
        name="dashboard-notification-mark-read",
    ),
    path(
        "dashboard/notifications/<uuid:pk>/",
        NotificationDeleteView.as_view(),
        name="dashboard-notification-delete",
    ),
]
