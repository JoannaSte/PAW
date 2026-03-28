from django.db import models 
from django.db.models import JSONField
from django.contrib.auth.hashers import make_password, check_password
import random

def generate_random_nick():
    return f'User{random.randint(1000, 9999)}'

class User(models.Model):
    nick = models.CharField(max_length=50, default=generate_random_nick)
    firstname = models.CharField(max_length=50)
    surname = models.CharField(max_length=50)
    age = models.IntegerField()
    sex = models.CharField(max_length=10)
    password = models.CharField(max_length=100) #sprawdz metrody securuty
    department = models.CharField(max_length=100)

    def set_password(self, raw_password):
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        return check_password(raw_password, self.password)
    
class StudyUpload(models.Model):
    nick = models.CharField(max_length=50)
    filename = models.CharField(max_length=255)
    data = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.nick}: {self.filename} ({self.created_at:%Y-%m-%d %H:%M:%S})"


class StudyRecord(models.Model):
    """Jeden wiersz = jeden dzień z pliku JSON (format dane.json na pulpicie)."""
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    upload = models.ForeignKey(StudyUpload, on_delete=models.CASCADE, related_name="records")

    record_date = models.DateField()
    external_user_id = models.CharField(max_length=32)
    sleep_hours = models.FloatField()
    sleep_start_hour = models.IntegerField()
    sleep_quality_score = models.IntegerField()
    activity_level = models.CharField(max_length=64)
    stress_level = models.CharField(max_length=16)
    hourly_activity_vector = models.JSONField()
    hourly_heart_rate_vector = models.JSONField()
    hourly_steps_vector = models.JSONField()

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(
                fields=["external_user_id", "record_date"],
                name="api_studyre_externa_1a3ccc_idx",
            ),
        ]

    def __str__(self) -> str:
        return f"StudyRecord({self.external_user_id} @ {self.record_date})"

#gdjnagowy modul utroz
