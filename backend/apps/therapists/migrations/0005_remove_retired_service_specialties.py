from django.db import migrations


RETIRED_SPECIALTIES = {
    "Oncopsychology",
    "Religious and Existential Therapy",
}


def remove_retired_specialties(apps, schema_editor):
    TherapistProfile = apps.get_model("therapists", "TherapistProfile")

    for profile in TherapistProfile.objects.all().iterator():
        specialties = [
            specialty
            for specialty in profile.specialties
            if specialty not in RETIRED_SPECIALTIES
        ]
        if specialties != profile.specialties:
            profile.specialties = specialties
            profile.save(update_fields=["specialties"])


class Migration(migrations.Migration):
    dependencies = [
        ("therapists", "0004_clientstory_reviewed_status"),
    ]

    operations = [
        migrations.RunPython(remove_retired_specialties, migrations.RunPython.noop),
    ]
