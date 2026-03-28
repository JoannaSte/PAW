import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0004_studyupload"),
    ]

    operations = [
        migrations.CreateModel(
            name="StudyRecord",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("record_date", models.DateField()),
                ("external_user_id", models.CharField(max_length=32)),
                ("sleep_hours", models.FloatField()),
                ("sleep_start_hour", models.IntegerField()),
                ("sleep_quality_score", models.IntegerField()),
                ("activity_level", models.CharField(max_length=64)),
                ("stress_level", models.CharField(max_length=16)),
                ("hourly_activity_vector", models.JSONField()),
                ("hourly_heart_rate_vector", models.JSONField()),
                ("hourly_steps_vector", models.JSONField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "upload",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="records",
                        to="api.studyupload",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="api.user",
                    ),
                ),
            ],
            options={
                "indexes": [
                    models.Index(
                        fields=["external_user_id", "record_date"],
                        name="api_studyre_externa_1a3ccc_idx",
                    ),
                ],
            },
        ),
    ]
