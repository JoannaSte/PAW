from django.contrib import admin
from django.urls import path
from django.conf.urls.static import static 
from django.conf import settings  
from backend.api.views.study import get_studies, add_study

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/studies/", get_studies, name="get_studies"),  # Endpoint to retrieve all studies
    path("api/add-study/", add_study, name="get_studies"), 
]
