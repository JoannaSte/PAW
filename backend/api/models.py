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
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    upload = models.ForeignKey(StudyUpload, on_delete=models.CASCADE, related_name="records")

    external_id = models.IntegerField()
    latitude = models.FloatField()
    longitude = models.FloatField()
    value = models.FloatField()
    score = models.FloatField()
    activity_status = models.CharField(max_length=64)
    flag = models.IntegerField()

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["external_id"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self) -> str:
        return f"StudyRecord(external_id={self.external_id}, upload_id={self.upload_id})"

#gdjnagowy modul utroz