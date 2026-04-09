from django.db import models

from apps.common.models import TimeStampedUUIDModel


class BlogPost(TimeStampedUUIDModel):
    slug = models.SlugField(max_length=255, unique=True)
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=120)
    publish_date = models.DateField()
    author = models.ForeignKey(
        "therapists.TherapistProfile",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="blog_posts",
    )
    author_name = models.CharField(max_length=255)
    excerpt = models.TextField()
    featured_image_url = models.TextField(blank=True)
    content_html = models.TextField()
    tags = models.JSONField(default=list, blank=True)
    is_published = models.BooleanField(default=True)

    class Meta:
        ordering = ["-publish_date", "-created_at"]

    def __str__(self) -> str:
        return self.title
