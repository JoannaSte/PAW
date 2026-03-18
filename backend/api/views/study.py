from django.views.decorators.csrf import csrf_exempt
from api.models import User
from django.http import JsonResponse
import json
from django.contrib.auth.hashers import make_password


@csrf_exempt
def get_studies(request):
    
    if request.method == 'GET':
        study = User.objects.all().values()

    return JsonResponse(list(study), safe=False)

@csrf_exempt  
def add_user(request):
    if request.method != "POST":
        return JsonResponse({"error": "Metoda musi być POST"}, status=405)
    
    try:
        data = json.loads(request.body)  # odczytujemy JSON z request
    except json.JSONDecodeError:
        return JsonResponse({"error": "Nieprawidłowy JSON"}, status=400)

    # walidacja minimalna – sprawdzamy wymagane pola
    required_fields = ["username", "surname", "age", "sex", "password", "department"]
    for field in required_fields:
        if field not in data:
            return JsonResponse({"error": f"Brakuje pola: {field}"}, status=400)

    # tworzymy użytkownika
    user = User(
        username=data["username"],
        surname=data["surname"],
        age=data["age"],
        sex=data["sex"],
        password=make_password(data["password"]),  # hasło hashujemy
        department=data["department"],
        datafile=data.get("datafile", "text")
    )
    user.save()

    return JsonResponse({
        "message": "Użytkownik dodany",
        "user": {
            "id": user.id,
            "username": user.username,
            "surname": user.surname,
            "age": user.age,
            "sex": user.sex,
            "department": user.department,
            "datafile": user.datafile
        }
    })