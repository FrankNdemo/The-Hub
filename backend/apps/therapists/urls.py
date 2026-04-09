from django.urls import path

from .views import (
    ChangePasswordView,
    ChangeSecretPassphraseView,
    DashboardOverviewView,
    PublicTherapistProfileView,
    ResetPasswordView,
    TherapistLoginView,
    TherapistLogoutView,
    TherapistMeView,
    TherapistProfileDetailView,
    TherapistTokenRefreshView,
    VerifyPassphraseView,
)


urlpatterns = [
    path("public/therapist/", PublicTherapistProfileView.as_view(), name="public-therapist-profile"),
    path("auth/login/", TherapistLoginView.as_view(), name="therapist-login"),
    path("auth/logout/", TherapistLogoutView.as_view(), name="therapist-logout"),
    path("auth/refresh/", TherapistTokenRefreshView.as_view(), name="therapist-token-refresh"),
    path("auth/verify-passphrase/", VerifyPassphraseView.as_view(), name="verify-passphrase"),
    path("auth/reset-password/", ResetPasswordView.as_view(), name="therapist-reset-password"),
    path("auth/me/", TherapistMeView.as_view(), name="therapist-me"),
    path("dashboard/", DashboardOverviewView.as_view(), name="dashboard-overview"),
    path("dashboard/profile/", TherapistProfileDetailView.as_view(), name="therapist-profile-detail"),
    path("dashboard/change-password/", ChangePasswordView.as_view(), name="change-password"),
    path(
        "dashboard/change-secret-passphrase/",
        ChangeSecretPassphraseView.as_view(),
        name="change-secret-passphrase",
    ),
]
