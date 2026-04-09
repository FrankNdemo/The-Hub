from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.blog.seed_defaults import create_default_blog_posts
from apps.therapists.models import TherapistProfile


class Command(BaseCommand):
    help = "Create or update the primary therapist account used by the frontend demo."

    @transaction.atomic
    def handle(self, *args, **options):
        email = "likentnerg@gmail.com"
        password = "WellnessHub2026!"
        secret_passphrase = "gichia"

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
                    "phone": "+254 726 759 850",
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
        therapist.phone = "+254 726 759 850"
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

        self.stdout.write(self.style.SUCCESS("Primary therapist account and default content are ready."))
