import re

from django.conf import settings
from django.db import migrations


def build_room_url(booking) -> str:
    base_url = getattr(settings, "VIRTUAL_SESSION_BASE_URL", "https://meet.jit.si").rstrip("/")
    room_prefix = getattr(settings, "VIRTUAL_SESSION_ROOM_PREFIX", "the-wellness-hub")
    room_seed = booking.manage_token or booking.calendar_event_id or str(booking.pk)
    room_name = re.sub(r"[^a-zA-Z0-9-]+", "-", f"{room_prefix}-{room_seed}").strip("-")
    return f"{base_url}/{room_name.lower()}"


def refresh_virtual_session_links(apps, schema_editor):
    Booking = apps.get_model("bookings", "Booking")
    stale_bookings = Booking.objects.filter(session_type="virtual").filter(
        meet_link__startswith="https://calendar.google.com/calendar/render?"
    )

    for booking in stale_bookings.iterator():
        booking.meet_link = build_room_url(booking)
        booking.save(update_fields=["meet_link", "updated_at"])


class Migration(migrations.Migration):
    dependencies = [
        ("bookings", "0003_alter_booking_meet_link"),
    ]

    operations = [
        migrations.RunPython(refresh_virtual_session_links, migrations.RunPython.noop),
    ]
