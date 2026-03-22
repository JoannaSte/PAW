# """
# URL configuration for backend project.

# The `urlpatterns` list routes URLs to views. For more information please see:
#     https://docs.djangoproject.com/en/6.0/topics/http/urls/
# Examples:
# Function views
#     1. Add an import:  from my_app import views
#     2. Add a URL to urlpatterns:  path('', views.home, name='home')
# Class-based views
#     1. Add an import:  from other_app.views import Home
#     2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
# Including another URLconf
#     1. Import the include() function: from django.urls import include, path
#     2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
# """
# from django.contrib import admin
# from django.urls import path

# urlpatterns = [
#     path('admin/', admin.site.urls),
# ]


from django.contrib import admin
from django.urls import path
from django.conf.urls.static import static 
from django.conf import settings  
from api.views.study import get_studies, add_study, remove_study, upload_study
from api.views.login import  login_page
urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/studies/", get_studies, name="get_studies"),  # Endpoint to retrieve all studies
    path("api/add-study/", add_study, name="get_studies"), 
    path("api/login/", login_page, name="login_page"),
    path("api/remove-study/<str:nick>/", remove_study, name="remove_study"),
    path("api/upload-study/<str:nick>/", upload_study, name="upload_study"),
]
