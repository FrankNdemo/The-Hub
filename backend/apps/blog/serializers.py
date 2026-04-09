from rest_framework import serializers

from .models import BlogPost
from .services import estimate_read_time


class BlogPostSerializer(serializers.ModelSerializer):
    publishDate = serializers.DateField(source="publish_date")
    author = serializers.CharField(source="author_name")
    readTime = serializers.SerializerMethodField()
    featuredImage = serializers.CharField(source="featured_image_url", allow_blank=True)
    contentHtml = serializers.CharField(source="content_html")

    class Meta:
        model = BlogPost
        fields = [
            "id",
            "slug",
            "title",
            "category",
            "publishDate",
            "author",
            "readTime",
            "excerpt",
            "featuredImage",
            "contentHtml",
            "tags",
        ]

    def get_readTime(self, obj: BlogPost) -> str:
        return estimate_read_time(obj.content_html)


class BlogPostWriteSerializer(serializers.ModelSerializer):
    author = serializers.CharField(required=False, allow_blank=True)
    featuredImage = serializers.CharField(source="featured_image_url", allow_blank=True, required=False)
    contentHtml = serializers.CharField(source="content_html")
    publishDate = serializers.DateField(source="publish_date", required=False)

    class Meta:
        model = BlogPost
        fields = [
            "title",
            "category",
            "author",
            "excerpt",
            "featuredImage",
            "contentHtml",
            "tags",
            "publishDate",
        ]
