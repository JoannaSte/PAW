from django.db import models 
from django.db.models import JSONField

class User(models.Model):
    username = models.CharField(max_length=50)
    surname = models.CharField(max_length=50)
    age = models.IntegerField()
    sex = models.CharField(max_length=10)
    password = models.CharField(max_length=100)
    department = models.CharField(max_length=100)
    
