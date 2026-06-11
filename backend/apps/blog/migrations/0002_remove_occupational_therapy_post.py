from django.db import migrations


def remove_occupational_therapy_post(apps, schema_editor):
    BlogPost = apps.get_model("blog", "BlogPost")
    BlogPost.objects.filter(slug="occupational-therapy-everyday-independence").delete()
    BlogPost.objects.filter(category__iexact="Occupational Therapy").delete()


class Migration(migrations.Migration):
    dependencies = [
        ("blog", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(remove_occupational_therapy_post, migrations.RunPython.noop),
    ]
