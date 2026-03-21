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
def add_study(request):
    if request.method != "POST":
        return JsonResponse({"error": "Metoda musi być POST"}, status=405)
    
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Nieprawidłowy JSON"}, status=400)

    required_fields = ["username", "surname", "age", "sex", "password", "department"]
    for field in required_fields:
        if field not in data or data[field] == '':
            return JsonResponse({"error": f"Brakuje pola: {field}"}, status=400)

    # Bezpieczne rzutowanie wieku
    try:
        age = int(data["age"])
    except ValueError:
        return JsonResponse({"error": "Pole age musi być liczbą"}, status=400)

    try:
        user = User(
            username=data["username"],
            surname=data["surname"],
            age=age,
            sex=data["sex"],
            password=make_password(data["password"]),
            department=data["department"],
        )
        user.save()
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({
        "username": user.username,
        "surname": user.surname,
        "age": user.age,
        "sex": user.sex,
        "department": user.department,
    }, status=201)



@csrf_exempt
def upload_study(request):
    return 0