from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json
from api.models import User  # dostosuj do swojego importu

@csrf_exempt
def login_page(request):
    print("RAW BODY:", request.body)
    if request.method != 'POST':
        return JsonResponse({'error': 'Metoda musi być POST'}, status=400)

    try:
        data = json.loads(request.body)
        nick = data.get('nick')
        password = data.get('password')
    except Exception:
        return JsonResponse({'error': 'Nieprawidłowe dane JSON'}, status=400)

    if not nick or not password:
        return JsonResponse({'error': 'Brakuje username lub password'}, status=400)

    try:
        user = User.objects.get(nick=nick)
    except User.DoesNotExist:
        return JsonResponse({'error': 'Nieprawidłowy nick'}, status=400)

    if not user.check_password(password):
        return JsonResponse({'error': 'Nieprawidłowe hasło'}, status=400)

    return JsonResponse({'success': True, 'nick': user.nick})