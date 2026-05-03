from django.urls import path

from .views import (
    ChangePasswordView,
    ChangeSecretPassphraseView,
    ClientStorySubmitView,
    DashboardOverviewView,
    DashboardClientStoryDetailView,
    DashboardClientStoryPublishView,
    DashboardClientStoryUnpublishView,
    PublicClientStoryListView,
    PublicTherapistProfileView,
    PublicTherapistListView,
    ResetPasswordView,
    TherapistLoginView,
    TherapistLogoutView,
    TherapistMeView,
    TherapistProfileDetailView,
    TherapistProfileImageUploadView,
    TherapistTokenRefreshView,
    VerifyPassphraseView,
)


urlpatterns = [
    path("public/therapist/", PublicTherapistProfileView.as_view(), name="public-therapist-profile"),
    path("public/therapists/", PublicTherapistListView.as_view(), name="public-therapist-list"),
    path("public/stories/", PublicClientStoryListView.as_view(), name="public-client-story-list"),
    path("stories/", ClientStorySubmitView.as_view(), name="client-story-submit"),
    path("auth/login/", TherapistLoginView.as_view(), name="therapist-login"),
    path("auth/logout/", TherapistLogoutView.as_view(), name="therapist-logout"),
    path("auth/refresh/", TherapistTokenRefreshView.as_view(), name="therapist-token-refresh"),
    path("auth/verify-passphrase/", VerifyPassphraseView.as_view(), name="verify-passphrase"),
    path("auth/reset-password/", ResetPasswordView.as_view(), name="therapist-reset-password"),
    path("auth/me/", TherapistMeView.as_view(), name="therapist-me"),
    path("dashboard/", DashboardOverviewView.as_view(), name="dashboard-overview"),
    path("dashboard/profile/", TherapistProfileDetailView.as_view(), name="therapist-profile-detail"),
    path("dashboard/profile/upload-image/", TherapistProfileImageUploadView.as_view(), name="therapist-profile-image-upload"),
    path("dashboard/stories/<uuid:pk>/", DashboardClientStoryDetailView.as_view(), name="dashboard-client-story-detail"),
    path("dashboard/stories/<uuid:pk>/publish/", DashboardClientStoryPublishView.as_view(), name="dashboard-client-story-publish"),
    path(
        "dashboard/stories/<uuid:pk>/unpublish/",
        DashboardClientStoryUnpublishView.as_view(),
        name="dashboard-client-story-unpublish",
    ),
    path("dashboard/change-password/", ChangePasswordView.as_view(), name="change-password"),
    path(
        "dashboard/change-secret-passphrase/",
        ChangeSecretPassphraseView.as_view(),
        name="change-secret-passphrase",
    ),
]
