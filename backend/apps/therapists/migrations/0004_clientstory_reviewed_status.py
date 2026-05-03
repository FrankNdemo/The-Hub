from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("therapists", "0003_clientstory"),
    ]

    operations = [
        migrations.AlterField(
            model_name="clientstory",
            name="status",
            field=models.CharField(
                choices=[
                    ("pending", "Pending Review"),
                    ("reviewed", "Reviewed"),
                    ("published", "Published"),
                ],
                default="pending",
                max_length=20,
            ),
        ),
    ]
