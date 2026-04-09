from __future__ import annotations

import re
from datetime import date

from django.db import transaction
from django.utils.text import slugify

from apps.notifications.models import Notification

from .models import BlogPost


def strip_html(value: str) -> str:
    value = re.sub(r"<style[\s\S]*?</style>", " ", value, flags=re.IGNORECASE)
    value = re.sub(r"<script[\s\S]*?</script>", " ", value, flags=re.IGNORECASE)
    value = re.sub(r"<[^>]+>", " ", value)
    value = value.replace("&nbsp;", " ")
    return re.sub(r"\s+", " ", value).strip()


def estimate_read_time(content_html: str) -> str:
    words = len([word for word in strip_html(content_html).split(" ") if word])
    minutes = max(1, round(words / 200))
    return f"{minutes} min read"


def dedupe_slug(title: str, current_id=None) -> str:
    base_slug = slugify(title)
    candidate = base_slug
    counter = 1

    while BlogPost.objects.exclude(pk=current_id).filter(slug=candidate).exists():
        counter += 1
        candidate = f"{base_slug}-{counter}"

    return candidate


@transaction.atomic
def create_or_update_post(*, therapist, instance: BlogPost | None, data: dict) -> BlogPost:
    post = instance or BlogPost()
    is_edit = instance is not None

    post.title = data["title"]
    post.category = data["category"]
    post.author = therapist
    post.author_name = data.get("author") or therapist.name
    post.excerpt = data["excerpt"]
    post.featured_image_url = data.get("featured_image_url", "")
    post.content_html = data["content_html"]
    post.tags = data.get("tags", [])
    post.slug = dedupe_slug(post.title, post.pk)
    if not post.publish_date:
        post.publish_date = data.get("publish_date") or date.today()
    post.save()

    Notification.objects.create(
        therapist=therapist,
        type=Notification.NotificationType.BLOG,
        title="Blog post updated" if is_edit else "Blog post published",
        description=f"{post.title} is now available in the blog section.",
        blog_post=post,
    )

    return post
