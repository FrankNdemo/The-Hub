from django.contrib.auth.hashers import make_password
from django.db import migrations


KELVIN_EMAIL = "ndemojnrr@gmail.com"
KELVIN_PASSWORD = "Wellness254!"
KELVIN_IMAGE_URL = "/kelvin.png"


def seed_kelvin_therapist(apps, schema_editor):
    User = apps.get_model("auth", "User")
    TherapistProfile = apps.get_model("therapists", "TherapistProfile")

    user = User.objects.filter(username__iexact=KELVIN_EMAIL).first() or User.objects.filter(
        email__iexact=KELVIN_EMAIL
    ).first()
    if user is None:
        user = User(username=KELVIN_EMAIL)

    user.email = KELVIN_EMAIL
    user.username = KELVIN_EMAIL
    user.first_name = "Kelvin"
    user.last_name = "Kagiri"
    user.is_staff = True
    user.password = make_password(KELVIN_PASSWORD)
    user.save()

    profile = TherapistProfile.objects.filter(public_id="kelvin-kagiri").first() or TherapistProfile.objects.filter(
        email__iexact=KELVIN_EMAIL
    ).first()
    if profile is None:
        profile = TherapistProfile(public_id="kelvin-kagiri")

    primary_secret_hash = (
        TherapistProfile.objects.filter(public_id="caroline-gichia")
        .values_list("secret_passphrase_hash", flat=True)
        .first()
    )

    profile.user = user
    profile.public_id = "kelvin-kagiri"
    profile.name = "Kelvin Kagiri"
    profile.title = "Psychologist"
    profile.bio = (
        "Kelvin supports teenagers, young adults, individuals, and groups with practical DBT-informed care for "
        "emotional challenges, substance abuse recovery, and healthier coping skills."
    )
    profile.qualifications = "Psychologist"
    profile.approach = "DBT-informed youth and substance abuse therapy"
    profile.experience = "Early teenage and youth therapy, group sessions, substance abuse support, and employee wellness"
    profile.focus_areas = "Youth mentorship, drug and substance abuse support, suicide prevention, employee wellness, and team building"
    profile.specialties = [
        "Detection of mental health issues",
        "Drug and substance abuse support",
        "Suicide prevention",
        "Teenage and youth mentorship",
        "Employee wellness training",
        "Team building",
    ]
    profile.email = KELVIN_EMAIL
    profile.phone = "+254114470441"
    profile.location_lines = [
        "Real Lite by Broadcom",
        "Nairobi, Westlands",
    ]
    profile.image_url = KELVIN_IMAGE_URL
    profile.is_primary = False
    profile.secret_passphrase_hash = primary_secret_hash or make_password("gichia")
    profile.save()


class Migration(migrations.Migration):

    dependencies = [
        ("therapists", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_kelvin_therapist, migrations.RunPython.noop),
    ]
