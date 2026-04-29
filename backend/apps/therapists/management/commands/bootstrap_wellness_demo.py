from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.blog.seed_defaults import create_default_blog_posts
from apps.therapists.models import TherapistProfile


class Command(BaseCommand):
    help = "Create or update therapist accounts used by the frontend demo."

    @transaction.atomic
    def handle(self, *args, **options):
        email = "likentnerg@gmail.com"
        password = "WellnessHub2026!"
        secret_passphrase = "gichia"
        kelvin_email = "ndemojnrr@gmail.com"
        kelvin_password = "Wellness254!"
        kelvin_image_url = "/kelvin.png"

        therapist = TherapistProfile.objects.select_related("user").filter(public_id="caroline-gichia").first()

        if therapist:
            user = therapist.user
        else:
            user, _ = User.objects.get_or_create(
                username=email,
                defaults={
                    "email": email,
                    "first_name": "Caroline",
                    "last_name": "Gichia",
                    "is_staff": True,
                },
            )

        user.email = email
        user.username = email
        user.first_name = "Caroline"
        user.last_name = "Gichia"
        user.is_staff = True
        user.set_password(password)
        user.save()

        if therapist is None:
            therapist, _ = TherapistProfile.objects.get_or_create(
                user=user,
                defaults={
                    "public_id": "caroline-gichia",
                    "name": "Caroline Gichia",
                    "title": "CBT Psychologist",
                    "bio": (
                        "Caroline is a compassionate CBT psychologist who supports individuals, families, "
                        "adolescents, and organizations with calm, evidence-based care rooted in warmth and dignity."
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
                    "email": email,
                    "phone": "+254114470441",
                    "location_lines": [
                        "Nairobi, Westlands",
                        "1st Floor Realite Building",
                        "Crescent Lane off Parklands Road",
                    ],
                    "image_url": "",
                    "is_primary": True,
                    "secret_passphrase_hash": "",
                },
            )
        elif therapist.user_id != user.id:
            therapist.user = user

        therapist.public_id = "caroline-gichia"
        therapist.name = "Caroline Gichia"
        therapist.title = "CBT Psychologist"
        therapist.bio = (
            "Caroline is a compassionate CBT psychologist who supports individuals, families, adolescents, "
            "and organizations with calm, evidence-based care rooted in warmth and dignity."
        )
        therapist.qualifications = "Certified CBT Psychologist"
        therapist.approach = "Cognitive Behavioral Therapy"
        therapist.experience = "Individual, Family, Adolescent, and Corporate Wellness"
        therapist.focus_areas = "Anxiety, grief, ADHD, trauma, family support, and LGBTQ+ care"
        therapist.specialties = [
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
        ]
        therapist.email = email
        therapist.phone = "+254114470441"
        therapist.location_lines = [
            "Nairobi, Westlands",
            "1st Floor Realite Building",
            "Crescent Lane off Parklands Road",
        ]
        therapist.image_url = therapist.image_url or ""
        therapist.is_primary = True
        therapist.set_secret_passphrase(secret_passphrase)
        therapist.save()
        create_default_blog_posts(therapist)

        kelvin_user, _ = User.objects.get_or_create(
            username=kelvin_email,
            defaults={
                "email": kelvin_email,
                "first_name": "Kelvin",
                "last_name": "Kagiri",
                "is_staff": True,
            },
        )
        kelvin_user.email = kelvin_email
        kelvin_user.username = kelvin_email
        kelvin_user.first_name = "Kelvin"
        kelvin_user.last_name = "Kagiri"
        kelvin_user.is_staff = True
        kelvin_user.set_password(kelvin_password)
        kelvin_user.save()

        kelvin, _ = TherapistProfile.objects.get_or_create(
            public_id="kelvin-kagiri",
            defaults={
                "user": kelvin_user,
                "name": "Kelvin Kagiri",
                "title": "Psychologist",
                "email": kelvin_email,
                "secret_passphrase_hash": "",
            },
        )
        kelvin.user = kelvin_user
        kelvin.name = "Kelvin Kagiri"
        kelvin.title = "Psychologist"
        kelvin.bio = (
            "Kelvin supports teenagers, young adults, individuals, and groups with practical DBT-informed care for "
            "emotional challenges, substance abuse recovery, and healthier coping skills."
        )
        kelvin.qualifications = "Psychologist"
        kelvin.approach = "DBT-informed youth and substance abuse therapy"
        kelvin.experience = "Early teenage and youth therapy, group sessions, substance abuse support, and employee wellness"
        kelvin.focus_areas = "Youth mentorship, drug and substance abuse support, suicide prevention, employee wellness, and team building"
        kelvin.specialties = [
            "Detection of mental health issues",
            "Drug and substance abuse support",
            "Suicide prevention",
            "Teenage and youth mentorship",
            "Employee wellness training",
            "Team building",
        ]
        kelvin.email = kelvin_email
        kelvin.phone = "+254114470441"
        kelvin.location_lines = [
            "Real Lite by Broadcom",
            "Nairobi, Westlands",
        ]
        kelvin.image_url = kelvin_image_url
        kelvin.is_primary = False
        kelvin.set_secret_passphrase(secret_passphrase)
        kelvin.save()

        self.stdout.write(self.style.SUCCESS("Therapist accounts and default content are ready."))
