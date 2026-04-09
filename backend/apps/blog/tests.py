from django.core.management import call_command
from rest_framework import status
from rest_framework.test import APITestCase

from apps.notifications.models import Notification
from apps.therapists.models import TherapistProfile


class BlogDashboardApiTests(APITestCase):
    def setUp(self):
        call_command("bootstrap_wellness_demo")
        self.therapist = TherapistProfile.objects.select_related("user").get(public_id="caroline-gichia")
        self.client.force_authenticate(user=self.therapist.user)

    def test_create_blog_post_from_dashboard_endpoint(self):
        response = self.client.post(
            "/api/v1/dashboard/blog-posts/",
            {
                "title": "Building Calm in Busy Seasons",
                "category": "Mental Health",
                "author": "Caroline Gichia",
                "excerpt": "A short reflection on rest and nervous system recovery.",
                "featuredImage": "https://example.com/post.jpg",
                "contentHtml": "<p>This is a test article with enough words to compute read time.</p>",
                "tags": ["Rest", "Stress"],
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["slug"], "building-calm-in-busy-seasons")
        self.assertEqual(Notification.objects.filter(type="blog").count(), 1)
