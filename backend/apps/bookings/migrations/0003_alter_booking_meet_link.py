from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("bookings", "0002_booking_soft_delete_fields"),
    ]

    operations = [
        migrations.AlterField(
            model_name="booking",
            name="meet_link",
            field=models.URLField(blank=True, max_length=2048),
        ),
    ]
