from datetime import datetime

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


# @csrf_exempt
# def add_study(request):
#     if request.method != "POST":
#         return JsonResponse({"error": "Metoda musi być POST"}, status=405)
    
#     try:
#         data = json.loads(request.body)
#     except json.JSONDecodeError:
#         return JsonResponse({"error": "Nieprawidłowy JSON"}, status=400)

#     required_fields = ["nick", "firstname", "surname", "age", "sex", "password", "department"]
#     for field in required_fields:
#         if field not in data or data[field] == '':
#             return JsonResponse({"error": f"Brakuje pola: {field}"}, status=400)

#     # Bezpieczne rzutowanie wieku
#     try:
#         age = int(data["age"])
#     except ValueError:
#         return JsonResponse({"error": "Pole age musi być liczbą"}, status=400)

#     try:
#         user = User(
#             nick=data["nick"],  # Nick jest opcjonalny, domyślnie pusty
#             firstname=data["firstname"],
#             surname=data["surname"],
#             age=age,
#             sex=data["sex"],
#             password=make_password(data["password"]),
#             department=data["department"],
#         )
#         user.save()
#     except Exception as e:
#         return JsonResponse({"error": str(e)}, status=500)

#     return JsonResponse({
#         "nick": user.nick,
#         "firstname": user.firstname,
#         "surname": user.surname,
#         "age": user.age,
#         "sex": user.sex,
#         "department": user.department,
#     }, status=201)

@csrf_exempt
def add_study(request):
    if request.method == 'POST':
        data = request.POST
        image = request.FILES.get('image')

        user = User(
            nick=data.get('nick'),
            firstname=data.get('firstname'),
            surname=data.get('surname'),
            age=data.get('age') or None,
            sex=data.get('sex'),
            department=data.get('department'),
        )

        if image:
            user.image = image

        print('jak wyglada imeg')
        print(user.image)
        user.set_password(data.get('password'))
        user.save()

        return JsonResponse({
            "nick": user.nick,
            "firstname": user.firstname,
            "surname": user.surname,
            "age": user.age,
            "sex": user.sex,
            "department": user.department,
            "image": user.image.url if user.image else None
        })


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

    if not isinstance(payload, list):
        return JsonResponse(
            {"error": "Oczekiwana jest tablica rekordów (np. [ {...}, {...} ])"},
            status=400,
        )

    required_keys = [
        "date",
        "user_id",
        "sleep_hours",
        "sleep_start_hour",
        "sleep_quality_score",
        "activity_level",
        "stress_level",
        "hourly_activity_vector",
        "hourly_heart_rate_vector",
        "hourly_steps_vector",
    ]

    user = User.objects.filter(nick=nick).first()
    record_ids = []

    for idx, item in enumerate(payload):
        if not isinstance(item, dict):
            return JsonResponse(
                {"error": f"Element #{idx} musi być obiektem JSON"},
                status=400,
            )
        missing = [k for k in required_keys if k not in item]
        if missing:
            return JsonResponse(
                {"error": f"Rekord #{idx}: brakuje pól: {', '.join(missing)}"},
                status=400,
            )

        try:
            record_date = datetime.strptime(str(item["date"]), "%Y-%m-%d").date()
        except ValueError:
            return JsonResponse(
                {"error": f"Rekord #{idx}: pole 'date' musi być w formacie YYYY-MM-DD"},
                status=400,
            )

        try:
            rec = StudyRecord.objects.create(
                user=user,
                upload=saved,
                record_date=record_date,
                external_user_id=str(item["user_id"]),
                sleep_hours=float(item["sleep_hours"]),
                sleep_start_hour=int(item["sleep_start_hour"]),
                sleep_quality_score=int(item["sleep_quality_score"]),
                activity_level=str(item["activity_level"]),
                stress_level=str(item["stress_level"]),
                hourly_activity_vector=list(item["hourly_activity_vector"]),
                hourly_heart_rate_vector=list(item["hourly_heart_rate_vector"]),
                hourly_steps_vector=list(item["hourly_steps_vector"]),
            )
        except (TypeError, ValueError) as e:
            return JsonResponse(
                {"error": f"Rekord #{idx}: nieprawidłowe typy wartości — {e}"},
                status=400,
            )

        record_ids.append(rec.id)

    return JsonResponse(
        {
            "success": True,
            "id": saved.id,
            "records_count": len(record_ids),
            "record_ids": record_ids,
            "nick": nick,
            "filename": uploaded.name,
        },
        safe=True,
        status=200,
    )



def get_user_records(request, nick):
    if request.method != "GET":
        return JsonResponse({"error": "Tylko GET"}, status=405)

    user = User.objects.filter(nick=nick).first()

    if user:
        records = StudyRecord.objects.filter(user=user)
    else:
        # fallback jeśli user=None przy zapisie
        records = StudyRecord.objects.filter(upload__nick=nick)

    data = list(records.values(
        "id",
        "record_date",
        "external_user_id",
        "sleep_hours",
        "sleep_start_hour",
        "sleep_quality_score",
        "activity_level",
        "stress_level",
        "hourly_activity_vector",
        "hourly_heart_rate_vector",
        "hourly_steps_vector",
        "created_at",
        "upload_id",
        "user_id",
    ))

    return JsonResponse(data, safe=False)