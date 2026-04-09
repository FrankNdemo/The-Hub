from django.urls import path

from .views import (
    PublicBlogPostDetailView,
    PublicBlogPostListView,
    TherapistBlogPostDetailView,
    TherapistBlogPostListCreateView,
)


urlpatterns = [
    path("blog/posts/", PublicBlogPostListView.as_view(), name="public-blog-post-list"),
    path("blog/posts/<slug:slug>/", PublicBlogPostDetailView.as_view(), name="public-blog-post-detail"),
    path("dashboard/blog-posts/", TherapistBlogPostListCreateView.as_view(), name="dashboard-blog-posts"),
    path("dashboard/blog-posts/<uuid:pk>/", TherapistBlogPostDetailView.as_view(), name="dashboard-blog-post-detail"),
]
