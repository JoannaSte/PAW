from django.views.decorators.csrf import csrf_exempt
from api.models import User
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

    if 'file' not in request.FILES:
        return JsonResponse({"error": "Brak pliku w żądaniu"}, status=400)

    uploaded_file = request.FILES['file']
    try:
        file_content = uploaded_file.read().decode('utf-8')
        root = ET.fromstring(file_content)
    except Exception as e:
        return JsonResponse({"error": f"Błąd odczytu pliku XML: {str(e)}"}, status=400)

    # Przestrzeń nazw CDA
    ns = {'n': 'urn:hl7-org:v3'}

    try:
        # 1. Pobieranie danych pacjenta z XML
        patient = root.find(".//n:patient", ns)
        gender = "U"
        birth_year = 2000

        if patient is not None:
            gender_elem = patient.find("n:administrativeGenderCode", ns)
            if gender_elem is not None:
                gender = gender_elem.attrib.get("code", "U")
            
            birth_elem = patient.find("n:birthTime", ns)
            if birth_elem is not None:
                birth_val = birth_elem.attrib.get("value", "2000")
                birth_year = int(birth_val[:4])

        # Obliczanie wieku na rok 2026 (zgodnie z Twoim założeniem)
        age = 2026 - birth_year

        # 2. Pobieranie parametrów życiowych
        height = None
        weight_values = []
        heart_rates = []

        for obs in root.findall(".//n:observation", ns):
            code_elem = obs.find("n:code", ns)
            if code_elem is None:
                continue
            
            display_name = code_elem.attrib.get("displayName", "")
            value_elem = obs.find("n:value", ns)
            
            if value_elem is None or "value" not in value_elem.attrib:
                continue
            
            try:
                val = float(value_elem.attrib.get("value"))
                if "Height" in display_name:
                    height = int(val)
                elif "Body weight" in display_name:
                    weight_values.append(val)
                elif "Heart rate" in display_name:
                    heart_rates.append(val)
            except ValueError:
                continue

        # Obliczanie średnich
        avg_weight = round(sum(weight_values) / len(weight_values), 1) if weight_values else None
        avg_hr = round(sum(heart_rates) / len(heart_rates), 1) if heart_rates else None

        # 3. Zapis do bazy danych (z przypisaniem nicku do Imienia i Nazwiska)
        # filter().first() zapobiega błędowi "MultipleObjectsReturned"
        user = User.objects.filter(nick=nick).first()

        if user:
            # Aktualizacja istniejącego użytkownika
            user.firstname = nick  # Imię = nick
            user.surname = nick    # Nazwisko = nick
            user.age = age
            user.sex = gender
            user.save()
        else:
            # Tworzenie nowego użytkownika
            user = User.objects.create(
                nick=nick,
                firstname=nick,    # Imię = nick
                surname=nick,      # Nazwisko = nick
                age=age,
                sex=gender,
                password=make_password("tajne"),
                department="HealthData",
            )

        # 4. Zwrot odpowiedzi JSON
        return JsonResponse({
            "nick": user.nick,
            "firstname": user.firstname,
            "surname": user.surname,
            "age": user.age,
            "sex": user.sex,
            "height": height,
            "avg_weight": avg_weight,
            "avg_heart_rate": avg_hr
        }, status=201)

    except Exception as e:
        return JsonResponse({"error": f"Błąd przetwarzania: {str(e)}"}, status=400)