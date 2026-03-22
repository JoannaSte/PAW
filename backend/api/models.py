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
    
#gdjnagowy modul utroz