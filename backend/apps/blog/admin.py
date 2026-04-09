from django.contrib import admin

from .models import BlogPost


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "author_name", "publish_date", "is_published")
    list_filter = ("category", "is_published", "publish_date")
    search_fields = ("title", "slug", "author_name", "excerpt")
