from django.test import TestCase, Client
from django.contrib.auth.hashers import make_password
from django.core.files.uploadedfile import SimpleUploadedFile
from api.models import User, StudyUpload, StudyRecord
from api.views.statistics import safe_pearson
import json

class HealthMonitoringTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        # Create a test user
        self.user = User.objects.create(
            nick="testnick",
            firstname="Jan",
            surname="Kowalski",
            age=30,
            sex="M",
            department="IT"
        )
        self.user.set_password("tajnehaslo")
        self.user.save()

    def test_user_password_hashing(self):
        """Test hashowania i sprawdzania haseł w modelu User"""
        self.assertTrue(self.user.check_password("tajnehaslo"))
        self.assertFalse(self.user.check_password("zlehaslo"))

    def test_random_nick_generator(self):
        """Test generowania losowych nicków w modelu User"""
        temp_user = User.objects.create(
            firstname="Anna",
            surname="Nowak",
            age=25,
            sex="K",
            department="HR",
            password="haslo"
        )
        self.assertTrue(temp_user.nick.startswith("User"))
        self.assertEqual(len(temp_user.nick), 8) # User + 4 digits = 8 chars

    def test_get_studies_api(self):
        """Test pobierania listy użytkowników"""
        response = self.client.get('/api/studies/')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertTrue(len(data) >= 1)
        self.assertEqual(data[0]['nick'], "testnick")

    def test_add_study_api(self):
        """Test dodawania nowego użytkownika (rejestracja)"""
        payload = {
            "nick": "nowy_uzytkownik",
            "firstname": "Adam",
            "surname": "Malysz",
            "age": 40,
            "sex": "M",
            "department": "Sport",
            "password": "skoki"
        }
        response = self.client.post('/api/add-study/', payload)
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertEqual(data["nick"], "nowy_uzytkownik")
        
        # Sprawdzenie czy użytkownik został poprawnie dodany do bazy z hashowanym hasłem
        db_user = User.objects.get(nick="nowy_uzytkownik")
        self.assertTrue(db_user.check_password("skoki"))

    def test_login_page_api(self):
        """Test logowania użytkownika"""
        # Poprawne logowanie
        response = self.client.post(
            '/api/login/',
            json.dumps({"nick": "testnick", "password": "tajnehaslo"}),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertTrue(data["success"])
        self.assertEqual(data["nick"], "testnick")

        # Błędne hasło
        response_wrong_pass = self.client.post(
            '/api/login/',
            json.dumps({"nick": "testnick", "password": "zle"}),
            content_type="application/json"
        )
        self.assertEqual(response_wrong_pass.status_code, 400)
        
        # Błędny nick
        response_wrong_nick = self.client.post(
            '/api/login/',
            json.dumps({"nick": "nieistnieje", "password": "haslo"}),
            content_type="application/json"
        )
        self.assertEqual(response_wrong_nick.status_code, 400)

    def test_correlation_view_api(self):
        """Test obliczania korelacji Pearsona w statistics.py"""
        # Poprawne dane o silnej korelacji
        payload = {
            "sleep": [8, 7, 6, 5, 4],
            "stress": [1, 2, 3, 4, 5],
            "quality": [9, 8, 7, 6, 5],
            "activity": [3, 3, 2, 1, 1]
        }
        response = self.client.post(
            '/api/correlation/',
            json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertIn("correlations", data)
        # Stres i sen skorelowane ujemnie (-1.0)
        self.assertAlmostEqual(data["correlations"]["stress_sleep"], -1.0)

        # Brak możliwości wyliczenia korelacji (stały wektor - std = 0)
        payload_const = {
            "sleep": [8, 8, 8, 8, 8],
            "stress": [1, 2, 3, 4, 5],
            "quality": [9, 8, 7, 6, 5],
            "activity": [3, 3, 2, 1, 1]
        }
        response_const = self.client.post(
            '/api/correlation/',
            json.dumps(payload_const),
            content_type="application/json"
        )
        self.assertEqual(response_const.status_code, 200)
        data_const = json.loads(response_const.content)
        self.assertIsNone(data_const["correlations"]["stress_sleep"])
        self.assertIn("warnings", data_const)

    def test_upload_and_get_user_records(self):
        """Test uploadu pliku JSON z rekordami oraz pobierania tych rekordów"""
        records_payload = [
            {
                "date": "2026-06-01",
                "user_id": "ext123",
                "sleep_hours": 7.5,
                "sleep_start_hour": 22,
                "sleep_quality_score": 80,
                "activity_level": "Highly Active",
                "stress_level": "Low",
                "hourly_activity_vector": [1]*24,
                "hourly_heart_rate_vector": [65]*24,
                "hourly_steps_vector": [200]*24
            }
        ]
        
        uploaded_file = SimpleUploadedFile(
            "test_dane.json",
            json.dumps(records_payload).encode("utf-8"),
            content_type="application/json"
        )
        
        # Wykonanie uploadu
        response = self.client.post(
            f'/api/upload-study/{self.user.nick}/',
            {"file": uploaded_file}
        )
        self.assertEqual(response.status_code, 200)
        upload_data = json.loads(response.content)
        self.assertTrue(upload_data["success"])
        self.assertEqual(upload_data["records_count"], 1)

        # Pobranie zapisanych rekordów
        response_get = self.client.get(f'/api/get-user-records/{self.user.nick}/')
        self.assertEqual(response_get.status_code, 200)
        records_data = json.loads(response_get.content)
        self.assertEqual(len(records_data), 1)
        self.assertEqual(records_data[0]["external_user_id"], "ext123")
        self.assertEqual(records_data[0]["sleep_hours"], 7.5)

    def test_remove_study_api(self):
        """Test usuwania użytkownika"""
        response = self.client.delete(f'/api/remove-study/{self.user.nick}/')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertTrue(data["success"])
        
        # Upewnienie się, że użytkownik zniknął z bazy
        self.assertFalse(User.objects.filter(nick=self.user.nick).exists())

    def test_safe_pearson_edge_cases(self):
        """Testy przypadków brzegowych dla funkcji safe_pearson"""
        # Puste dane lub None
        self.assertIsNone(safe_pearson([], []))
        self.assertIsNone(safe_pearson(None, [1, 2]))
        
        # Różna długość wektorów
        self.assertIsNone(safe_pearson([1, 2], [1, 2, 3]))
        
        # Za krótki wektor (długość < 2)
        self.assertIsNone(safe_pearson([1], [2]))
        
        # Std dev = 0 (wektory stałe)
        self.assertIsNone(safe_pearson([5, 5, 5], [1, 2, 3]))
        self.assertIsNone(safe_pearson([1, 2, 3], [4, 4, 4]))
        
        # Nieliczbowe dane (rzucające wyjątek)
        self.assertIsNone(safe_pearson(["abc", "def"], [1, 2]))
        
        # Poprawne obliczenie korelacji (dodatnia)
        self.assertAlmostEqual(safe_pearson([1, 2, 3], [2, 4, 6]), 1.0)
        # Poprawne obliczenie korelacji (ujemna)
        self.assertAlmostEqual(safe_pearson([1, 2, 3], [6, 4, 2]), -1.0)

    def test_study_models_str(self):
        """Test reprezentacji tekstowej modeli StudyUpload i StudyRecord"""
        upload = StudyUpload.objects.create(
            nick="str_test",
            filename="str_test.json",
            data={}
        )
        # Sprawdzenie StudyUpload __str__
        expected_upload_str = f"str_test: str_test.json ({upload.created_at:%Y-%m-%d %H:%M:%S})"
        self.assertEqual(str(upload), expected_upload_str)

        record = StudyRecord.objects.create(
            user=self.user,
            upload=upload,
            record_date="2026-06-01",
            external_user_id="ext_str",
            sleep_hours=8.0,
            sleep_start_hour=23,
            sleep_quality_score=90,
            activity_level="Low",
            stress_level="Low",
            hourly_activity_vector=[],
            hourly_heart_rate_vector=[],
            hourly_steps_vector=[]
        )
        # Sprawdzenie StudyRecord __str__
        self.assertEqual(str(record), "StudyRecord(ext_str @ 2026-06-01)")

    def test_remove_study_nonexistent(self):
        """Test usuwania nieistniejącego użytkownika zwraca 404"""
        response = self.client.delete('/api/remove-study/nonexistentnick/')
        self.assertEqual(response.status_code, 404)
        data = json.loads(response.content)
        self.assertIn("error", data)

    def test_upload_study_invalid_file(self):
        """Test uploadu z brakującym plikiem lub uszkodzonym JSON-em"""
        # Brak pliku
        response_no_file = self.client.post(f'/api/upload-study/{self.user.nick}/')
        self.assertEqual(response_no_file.status_code, 400)
        
        # Uszkodzony JSON
        uploaded_file = SimpleUploadedFile(
            "bad.json",
            b"{broken json",
            content_type="application/json"
        )
        response_bad_json = self.client.post(
            f'/api/upload-study/{self.user.nick}/',
            {"file": uploaded_file}
        )
        self.assertEqual(response_bad_json.status_code, 400)
        data = json.loads(response_bad_json.content)
        self.assertIn("error", data)

    def test_login_missing_fields(self):
        """Test logowania przy braku wymaganych pól w żądaniu"""
        response = self.client.post(
            '/api/login/',
            json.dumps({"nick": "testnick"}),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content)
        self.assertEqual(data["error"], "Brakuje username lub password")

    def test_add_study_duplicate_nick(self):
        """Test dodawania nowego użytkownika z nickiem, który już istnieje w bazie"""
        payload = {
            "nick": "testnick",  # Już stworzony w setUp
            "firstname": "Adam",
            "surname": "Nowak",
            "age": 22,
            "sex": "M",
            "department": "HR",
            "password": "haslo"
        }
        response = self.client.post('/api/add-study/', payload)
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content)
        self.assertEqual(data["error"], "Użytkownik o takim nicku już istnieje")
