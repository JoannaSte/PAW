import React, { useState, useEffect } from 'react';
import API_BASE_URL from "../utils/config";
import { useNavigate } from 'react-router-dom';
import './ListPage.css';

const DataFilePage = () => {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();
  const [currentPage] = useState(1); // na razie bez paginacji – możesz dodać później
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nick: '',
    firstname: '',
    surname: '',
    age: '',
    sex: '',
    password: '',
    department: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/studies/`);
      if (!res.ok) throw new Error('Błąd pobierania listy');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Błąd pobierania:", err);
      setErrorMessage("Nie udało się pobrać listy użytkowników");
    }
  };

  const removeUsers = async (nick) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/remove-study/${nick}/`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Błąd usuwania użytkownika');
      const data = await res.json();
      setUsers(prev => prev.filter(user => user.nick !== nick));
    } catch (err) {
      console.error("Błąd pobierania:", err);
      setErrorMessage("Nie udało się pobrać listy użytkowników");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'age' ? value : value.trimStart(), // usuwa spacje z początku
    }));
    setErrorMessage(''); // czyścimy błąd przy każdej zmianie
  };

  const validateForm = () => {
    if (!formData.nick.trim()) return "Nick jest wymagany";
    if (!formData.firstname.trim()) return "Imie jest wymagane";
    if (!formData.surname.trim()) return "Nazwisko jest wymagane";
    if (!formData.sex.trim()) return "Płeć jest wymagana";
    if (!formData.department.trim()) return "Wydział / dział jest wymagany";
    if (!formData.password) return "Hasło jest wymagane";

    const ageNum = Number(formData.age);
    if (formData.age !== '' && (isNaN(ageNum) || ageNum < 0 || ageNum > 120)) {
      return "Wiek musi być liczbą od 0 do 120";
    }

    return '';
  };
  

  const submitForm = async () => {
    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const payload = {
      nick: formData.nick.trim(),
      firstname: formData.firstname.trim(),
      surname: formData.surname.trim(),
      age: formData.age.trim() === '' ? null : Number(formData.age),
      sex: formData.sex.trim(),
      password: formData.password,
      department: formData.department.trim(),
    };

    console.log("Wysyłane dane:", payload);

    try {
      const res = await fetch(`${API_BASE_URL}/api/add-study/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await res.json();

      if (!res.ok) {
        const serverError = responseData.error || responseData.detail || 'Błąd serwera';
        throw new Error(serverError);
      }

      // Sukces
      setUsers((prev) => [...prev, responseData]);
      setShowForm(false);
      setFormData({
        nick: '',
        firstname: '',
        surname: '',
        age: '',
        sex: '',
        password: '',
        department: '',
      });
      setErrorMessage('');
    } catch (err) {
      console.error("Błąd:", err);
      setErrorMessage(err.message || "Coś poszło nie tak – sprawdź konsolę");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="data-file-page">
      <h1 className = 'title'>Lista użytkowników</h1>

      <button 
        className='primary-btn'
        onClick={() => {
          setShowForm(true);
          setErrorMessage('');
        }}
        disabled={isSubmitting}
      >
        Dodaj nowy rekord
      </button>

      {showForm && (
        <div className='form-card'>
          <h3>Dodaj nowy wpis</h3>

          {errorMessage && (
            <div 
              className='error-box'
            >
              {errorMessage}
            </div>
          )}

          <div className='form'>
            <input
              className = 'input'
              name="nick"
              placeholder="Nick *"
              value={formData.nick}
              onChange={handleFormChange}
              required
            />
            <input
              className = 'input'
              name="firstname"
              placeholder="Imie *"
              value={formData.firstname}
              onChange={handleFormChange}
              required
            />
            <input
              className = 'input'
              name="surname"
              placeholder="Nazwisko *"
              value={formData.surname}
              onChange={handleFormChange}
              required
            />
            <input
              className = 'input'
              name="age"
              placeholder="Wiek"
              value={formData.age}
              onChange={handleFormChange}
              type="number"
              min="0"
              max="120"
            />
            <input
              className = 'input'
              name="sex"
              placeholder="Płeć (np. M / K / inne) *"
              value={formData.sex}
              onChange={handleFormChange}
              required
            />
            <input
              className = 'input'
              name="password"
              placeholder="Hasło *"
              type="password"
              value={formData.password}
              onChange={handleFormChange}
              required
            />
            <input
              className = 'input'
              name="department"
              placeholder="Wydział / Dział *"
              value={formData.department}
              onChange={handleFormChange}
              required
            />

            <div className = 'form-actions'>
              <button
                onClick={submitForm}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Zapisywanie...' : 'Zapisz'}
              </button>
              <button
                className = 'secondary-btn'
                onClick={() => {
                  setShowForm(false);
                  setErrorMessage('');
                }}
                disabled={isSubmitting}
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      <table className='users-table'>
        <thead>
          <tr>
            <th>Nick</th>
            <th>Imie</th>
            <th>Nazwisko</th>
            <th>Wiek</th>
            <th>Płeć</th>
            <th>Dział</th>
            <th>Akcja</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.nick}>
              <td >{user.nick}</td>
              <td >{user.firstname}</td>
              <td >{user.surname}</td>
              <td >{user.age ?? '-'}</td>
              <td >{user.sex}</td>
              <td >{user.department}</td>
            
            <td>
              <button
              onClick={() => navigate(`/login`, {state: {nick:user.nick}})}
              >
                Log in
              </button>
            </td>
            <td>
              <button
              onClick={() => {
                if (window.confirm("Na pewno usunąć użytkownika?")) {
                  removeUsers(user.nick);
                }
              }}
              >
                remove
              </button>
            </td>
            </tr>
          ))}
        </tbody>
      </table>

      {users.length === 0 && (
        <p>Brak rekordów</p>
      )}
    </div>
  );
};

export default DataFilePage;