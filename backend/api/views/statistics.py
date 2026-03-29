from django.http import JsonResponse
import numpy as np
import json
from django.views.decorators.csrf import csrf_exempt

def safe_pearson(x, y):
    try:
        if not x or not y or len(x) != len(y) or len(x) < 2:
            return None

        x = np.array(x, dtype=float)
        y = np.array(y, dtype=float)

        if np.std(x) == 0 or np.std(y) == 0:
            return None

        corr = np.corrcoef(x, y)[0, 1]

        if np.isnan(corr):
            return None

        return float(corr)

    except Exception:
        return None

@csrf_exempt
def correlation_view(request):
    try:
        if request.method != "POST":
            return JsonResponse({"error": "Only POST allowed"}, status=405)

        try:
            data = json.loads(request.body.decode("utf-8"))
        except Exception:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

        sleep = data.get("sleep", [])
        stress = data.get("stress", [])
        quality = data.get("quality", [])
        activity = data.get("activity", [])

        result = {
            "stress_sleep": safe_pearson(stress, sleep),
            "stress_quality": safe_pearson(stress, quality),
            "stress_activity": safe_pearson(stress, activity),
        }

        warnings = {}
        for key, value in result.items():
            if value is None:
                warnings[key] = "Cannot compute correlation"

        return JsonResponse({
            "correlations": result,
            "warnings": warnings if warnings else None
        })

    except Exception as e:
        # 🔥 NAJWAŻNIEJSZE — NIGDY NIE ZWRACAJ HTML 500
        return JsonResponse({
            "error": "Internal server error",
            "details": str(e)
        }, status=500)