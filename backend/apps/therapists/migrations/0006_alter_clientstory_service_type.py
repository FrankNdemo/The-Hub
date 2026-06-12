from django.db import migrations, models


def expand_legacy_service_types(apps, schema_editor):
    ClientStory = apps.get_model("therapists", "ClientStory")
    labels = {
        "individual": "Individual Therapy",
        "family": "Family Therapy",
        "corporate": "Corporate Wellness",
    }

    for legacy_value, label in labels.items():
        ClientStory.objects.filter(service_type=legacy_value).update(service_type=label)


class Migration(migrations.Migration):

    dependencies = [
        ("therapists", "0005_remove_retired_service_specialties"),
    ]

    operations = [
        migrations.AlterField(
            model_name="clientstory",
            name="service_type",
            field=models.CharField(default="Individual Therapy", max_length=120),
        ),
        migrations.RunPython(expand_legacy_service_types, migrations.RunPython.noop),
    ]
