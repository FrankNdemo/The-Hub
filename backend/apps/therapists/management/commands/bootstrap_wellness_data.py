from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.therapists.models import TherapistProfile


THERAPISTS = [
    {
        "public_id": "caroline-gichia",
        "email": "cgichia@gmail.com",
        "first_name": "Caroline",
        "last_name": "Gichia",
        "name": "Caroline Gichia",
        "title": "CBT Psychologist",
        "bio": (
            "Caroline is a compassionate CBT psychologist who supports individuals, families, adolescents, "
            "and organizations with calm, evidence-based care rooted in warmth and dignity."
        ),
        "qualifications": "Certified CBT Psychologist",
        "approach": "Cognitive Behavioral Therapy",
        "experience": "Individual, Family, Adolescent, and Corporate Wellness",
        "focus_areas": "Anxiety, grief, ADHD, trauma, family support, and LGBTQ+ care",
        "specialties": [
            "Anxiety",
            "Depression",
            "Bariatric Psychology",
            "ADHD",
            "Autism",
            "Oncopsychology",
            "Grief and Loss",
            "LGBTQ+ Support",
            "Religious and Existential Therapy",
            "Corporate Wellness",
            "Family Therapy",
            "Trauma and CBT",
        ],
        "phone": "+254726759850",
        "location_lines": [
            "Nairobi, Westlands",
            "1st Floor Realite Building",
            "Crescent Lane off Parklands Road",
        ],
        "image_url": "",
        "is_primary": True,
        "test_password": "WellnessHub2026!",
    },
    {
        "public_id": "kelvin-kagiri",
        "email": "ndemojnrr@gmail.com",
        "first_name": "Kelvin",
        "last_name": "Kagiri",
        "name": "Kelvin Kagiri",
        "title": "Psychologist",
        "bio": (
            "Kelvin supports teenagers, young adults, individuals, and groups with practical DBT-informed care for "
            "emotional challenges, substance abuse recovery, and healthier coping skills."
        ),
        "qualifications": "Psychologist",
        "approach": "DBT-informed youth and substance abuse therapy",
        "experience": "Early teenage and youth therapy, group sessions, substance abuse support, and employee wellness",
        "focus_areas": "Youth mentorship, drug and substance abuse support, suicide prevention, employee wellness, and team building",
        "specialties": [
            "Detection of mental health issues",
            "Drug and substance abuse support",
            "Suicide prevention",
            "Teenage and youth mentorship",
            "Employee wellness training",
            "Team building",
        ],
        "phone": "+254726759850",
        "location_lines": [
            "Real Lite by Broadcom",
            "Nairobi, Westlands",
        ],
        "image_url": "/kelvin.png",
        "is_primary": False,
        "test_password": "Wellness254!",
    },
]


class Command(BaseCommand):
    help = "Create or update the production therapist profiles required by the site."

    def add_arguments(self, parser):
        parser.add_argument(
            "--with-test-credentials",
            action="store_true",
            help="Set predictable credentials for automated tests only.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        with_test_credentials = bool(options.get("with_test_credentials"))

        for therapist_data in THERAPISTS:
            email = therapist_data["email"]
            profile = TherapistProfile.objects.select_related("user").filter(
                public_id=therapist_data["public_id"]
            ).first()
            user = profile.user if profile else User.objects.filter(email__iexact=email).first()

            if user is None:
                user = User(username=email, email=email, is_staff=True)
                if with_test_credentials:
                    user.set_password(therapist_data["test_password"])
                else:
                    user.set_unusable_password()

            user.email = email
            user.username = email
            user.first_name = therapist_data["first_name"]
            user.last_name = therapist_data["last_name"]
            user.is_staff = True
            if with_test_credentials:
                user.set_password(therapist_data["test_password"])
            user.save()

            if profile is None:
                profile = TherapistProfile(user=user, public_id=therapist_data["public_id"])
            else:
                profile.user = user

            profile.name = therapist_data["name"]
            profile.title = therapist_data["title"]
            profile.bio = therapist_data["bio"]
            profile.qualifications = therapist_data["qualifications"]
            profile.approach = therapist_data["approach"]
            profile.experience = therapist_data["experience"]
            profile.focus_areas = therapist_data["focus_areas"]
            profile.specialties = therapist_data["specialties"]
            profile.email = email
            profile.phone = therapist_data["phone"]
            profile.location_lines = therapist_data["location_lines"]
            profile.image_url = therapist_data["image_url"]
            profile.is_primary = therapist_data["is_primary"]
            if not profile.secret_passphrase_hash or with_test_credentials:
                profile.set_secret_passphrase("gichia")
            profile.save()

        self.stdout.write(self.style.SUCCESS("Therapist profiles are ready."))
