from django.views.decorators.csrf import csrf_exempt
from api.models import User, StudyRecord, StudyUpload
from django.http import JsonResponse
import json
from django.contrib.auth.hashers import make_password
import xml.etree.ElementTree as ET

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

    required_fields = ["nick", "firstname", "surname", "age", "sex", "password", "department"]
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
            nick=data["nick"],  # Nick jest opcjonalny, domyślnie pusty
            firstname=data["firstname"],
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
        "nick": user.nick,
        "firstname": user.firstname,
        "surname": user.surname,
        "age": user.age,
        "sex": user.sex,
        "department": user.department,
    }, status=201)


@csrf_exempt
def remove_study(request, nick):
    if request.method != "DELETE":
        return JsonResponse({"error": "Metoda musi być DELETE"}, status=405)

    try:
        user = User.objects.get(nick=nick)
        user.delete()
        return JsonResponse({"success": True})
    except User.DoesNotExist:
        return JsonResponse({"error": "Nie znaleziono użytkownika"}, status=404)

@csrf_exempt
def upload_study(request, nick):

    if request.method != "POST":
        return JsonResponse({"error": "Metoda musi być POST"}, status=405)

    uploaded = request.FILES.get("file")
    if not uploaded:
        return JsonResponse({"error": "Brak pliku w polu 'file'"}, status=400)

    try:
        raw = uploaded.read()
        text = raw.decode("utf-8-sig")
        payload = json.loads(text)
    except UnicodeDecodeError:
        return JsonResponse({"error": "Nie udało się odczytać pliku jako UTF-8"}, status=400)
    except json.JSONDecodeError as e:
        return JsonResponse({"error": f"Nieprawidłowy JSON: {e.msg}"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

    print(f"[upload_study] nick={nick} filename={uploaded.name} size={uploaded.size}")
    print("[upload_study] JSON payload:")
    print(json.dumps(payload, ensure_ascii=False, indent=2))

    saved = StudyUpload.objects.create(
        nick=nick,
        filename=uploaded.name,
        data=payload,
    )

    required_keys = [
        "id",
        "latitude",
        "longitude",
        "value",
        "score",
        "activity_status",
        "flag",
    ]
    missing = [k for k in required_keys if k not in payload]
    if missing:
        return JsonResponse({"error": f"Brakuje pól w JSON: {', '.join(missing)}"}, status=400)

    user = User.objects.filter(nick=nick).first()

    record = StudyRecord.objects.create(
        user=user,
        upload=saved,
        external_id=int(payload["id"]),
        latitude=float(payload["latitude"]),
        longitude=float(payload["longitude"]),
        value=float(payload["value"]),
        score=float(payload["score"]),
        activity_status=str(payload["activity_status"]),
        flag=int(payload["flag"]),
    )

    return JsonResponse(
        {
            "success": True,
            "id": saved.id,
            "record_id": record.id,
            "nick": nick,
            "filename": uploaded.name,
            "data": payload,
        },
        safe=True,
        status=200,
    )