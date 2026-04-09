from django.contrib import admin
from django.urls import include, path

from apps.common.views import HealthCheckView


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/health/", HealthCheckView.as_view(), name="health-check"),
    path("api/v1/", include("apps.therapists.urls")),
    path("api/v1/", include("apps.bookings.urls")),
    path("api/v1/", include("apps.blog.urls")),
    path("api/v1/", include("apps.notifications.urls")),
]
