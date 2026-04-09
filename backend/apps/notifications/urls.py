from django.urls import path

from .views import MarkNotificationsReadView, NotificationDeleteView, TherapistNotificationListView


urlpatterns = [
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
