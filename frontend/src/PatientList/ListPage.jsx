// import React, { useState, useEffect } from 'react';
// import API_BASE_URL from "../utils/config";

// const DataFilePage = () => {
//   const [users, setUsers] = useState([]);
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 15;
//   const indexOfLast = currentPage * itemsPerPage;
//   const indexOfFirst = indexOfLast - itemsPerPage;

//   const [showForm, setShowForm] = useState(false);
//   const [formData, setFormData] = useState({
//     username: '',
//     surname: '',
//     age: '',
//     sex: '',
//     password: '',
//     department: '',
//   });

//   // Pobieranie istniejących użytkowników
//   const fetchUsers = async () => {
//     try {
//       const res = await fetch(`${API_BASE_URL}/api/studies/`);
//       const data = await res.json();
//       setUsers(data);
//     } catch (err) {
//       console.error("Błąd pobierania użytkowników:", err);
//     }
//   };

//   useEffect(() => {
//     fetchUsers();
//   }, []);

//   // Obsługa zmian w formularzu
//   const handleFormChange = (e) => {
//   const value = e.target.name === "age" ? Number(e.target.value) : e.target.value;
//   setFormData({
//     ...formData,
//     [e.target.name]: value,
//   });
// };
//   // Wysłanie formularza
//   const submitForm = async () => {
//     console.log("Dane wysyłane:", formData);
//     try {
//       const res = await fetch(`${API_BASE_URL}/api/add-study/`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(formData)
//       });
//       const data = await res.json();

//       setUsers(prev => [...prev, data]);
//       setShowForm(false);
//       setFormData({
//         username: '',
//         surname: '',
//         age: '',
//         sex: '',
//         password: '',
//         department: '',
//       });
//     } catch (err) {
//       console.error("Błąd dodawania użytkownika:", err);
//     }
//   };

//   return (
//     <div className="data-file-page">
//       <h1>Lista użytkowników</h1>
//       <button onClick={() => setShowForm(true)}>Upload Study</button>

//       {showForm && (
//         <div style={{ border: "1px solid black", padding: "10px", margin: "10px 0" }}>
//           <input name="username" placeholder="Username" value={formData.username} onChange={handleFormChange} />
//           <input name="surname" placeholder="Surname" value={formData.surname} onChange={handleFormChange} />
//           <input name="age" placeholder="Age" value={formData.age} onChange={handleFormChange} type="number" />
//           <input name="sex" placeholder="Sex" value={formData.sex} onChange={handleFormChange} />
//           <input name="password" placeholder="Password" type="password" value={formData.password} onChange={handleFormChange} />
//           <input name="department" placeholder="Department" value={formData.department} onChange={handleFormChange} />

//           <br /><br />
//           <button onClick={(e) => { 
//             e.preventDefault();   // <--- blokuje domyślny submit
//             submitForm(); 
//           }}> 
//             Submit
//           </button>
//           <button onClick={() => setShowForm(false)}>Cancel</button>
//         </div>
//       )}

//       <table>
//         <thead>
//           <tr>
//             <th>Username</th>
//             <th>Surname</th>
//             <th>Age</th>
//             <th>Sex</th>
//             <th>Department</th>
//           </tr>
//         </thead>
//         <tbody>
//           {users.slice(indexOfFirst, indexOfLast).map(user => (
//             <tr key={user.username || `${user.username}`}>
//               <td>{user.username}</td>
//               <td>{user.surname}</td>
//               <td>{user.age}</td>
//               <td>{user.sex}</td>
//               <td>{user.department}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export default DataFilePage;

import React, { useState, useEffect } from 'react';
import API_BASE_URL from "../utils/config";

const DataFilePage = () => {
  const [users, setUsers] = useState([]);
  const [currentPage] = useState(1); // na razie bez paginacji – możesz dodać później
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
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
    if (!formData.username.trim()) return "Username jest wymagany";
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
      username: formData.username.trim(),
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
        // Serwer zwrócił 400 / 500 → pokazujemy konkretny błąd
        const serverError = responseData.error || responseData.detail || 'Błąd serwera';
        throw new Error(serverError);
      }

      // Sukces
      setUsers((prev) => [...prev, responseData]);
      setShowForm(false);
      setFormData({
        username: '',
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
    <div className="data-file-page" style={{ padding: '20px' }}>
      <h1>Lista użytkowników</h1>

      <button
        onClick={() => {
          setShowForm(true);
          setErrorMessage('');
        }}
        disabled={isSubmitting}
      >
        Dodaj nowy rekord
      </button>

      {showForm && (
        <div
          style={{
            border: '1px solid #ccc',
            padding: '20px',
            margin: '20px 0',
            borderRadius: '8px',
            background: '#f9f9f9',
            maxWidth: '500px',
          }}
        >
          <h3>Dodaj nowy wpis</h3>

          {errorMessage && (
            <div style={{ color: 'crimson', marginBottom: '12px', fontWeight: 'bold' }}>
              {errorMessage}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              name="username"
              placeholder="Username *"
              value={formData.username}
              onChange={handleFormChange}
              required
            />
            <input
              name="surname"
              placeholder="Nazwisko *"
              value={formData.surname}
              onChange={handleFormChange}
              required
            />
            <input
              name="age"
              placeholder="Wiek"
              value={formData.age}
              onChange={handleFormChange}
              type="number"
              min="0"
              max="120"
            />
            <input
              name="sex"
              placeholder="Płeć (np. M / K / inne) *"
              value={formData.sex}
              onChange={handleFormChange}
              required
            />
            <input
              name="password"
              placeholder="Hasło *"
              type="password"
              value={formData.password}
              onChange={handleFormChange}
              required
            />
            <input
              name="department"
              placeholder="Wydział / Dział *"
              value={formData.department}
              onChange={handleFormChange}
              required
            />

            <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
              <button
                onClick={submitForm}
                disabled={isSubmitting}
                style={{ minWidth: '100px' }}
              >
                {isSubmitting ? 'Zapisywanie...' : 'Zapisz'}
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setErrorMessage('');
                }}
                disabled={isSubmitting}
                style={{ background: '#ccc' }}
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      <table style={{ marginTop: '30px', width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#eee' }}>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Username</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Nazwisko</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Wiek</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Płeć</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Dział</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.username}>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{user.username}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{user.surname}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{user.age ?? '-'}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{user.sex}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{user.department}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {users.length === 0 && <p style={{ marginTop: '20px' }}>Brak rekordów</p>}
    </div>
  );
};

export default DataFilePage;