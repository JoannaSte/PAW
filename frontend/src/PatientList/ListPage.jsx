import React, { useState, useEffect } from 'react';
import API_BASE_URL from "../utils/config";
import { useNavigate, useSearchParams } from 'react-router-dom';
import './ListPage.css';
import FightingMode from './FightingMode';

const DataFilePage = () => {
  const [showFightingMode, setShowFightingMode] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [sortField, setSortField] = useState('nick');
  const [sortOrder, setSortOrder] = useState('asc'); // asc / desc
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const [jumpPageInput, setJumpPageInput] = useState('');
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

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteClick = (nick) => {
    setDeleteTarget(nick);
    setDeletePassword('');
    setDeleteError('');
  };

  const handleDeleteConfirm = async () => {
    if (!deletePassword) {
      setDeleteError('Wpisz hasło');
      return;
    }
    setIsDeleting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nick: deleteTarget, password: deletePassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data.error || 'Nieprawidłowe hasło');
        return;
      }
      await removeUsers(deleteTarget);
      setDeleteTarget(null);
      setDeletePassword('');
    } catch (err) {
      setDeleteError('Błąd połączenia z serwerem');
    } finally {
      setIsDeleting(false);
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setImageFile(file);
        setErrorMessage('');
      } else {
        setErrorMessage('Dozwolone są tylko pliki graficzne');
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setImageFile(file);
        setErrorMessage('');
      } else {
        setErrorMessage('Dozwolone są tylko pliki graficzne');
      }
    }
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
      setErrorMessage(validateForm);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const formDataToSend = new FormData();

    formDataToSend.append('nick', formData.nick)
    formDataToSend.append('firstname', formData.firstname)
    formDataToSend.append('surname', formData.surname)
    formDataToSend.append('age', formData.age)
    formDataToSend.append('sex', formData.sex)
    formDataToSend.append('password', formData.password)
    formDataToSend.append('department', formData.department)

    if (imageFile) {
      formDataToSend.append('image', imageFile);
      console.log(imageFile)
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/add-study/`, {
        method: 'POST',
        body: formDataToSend,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      
      await fetchUsers();
      setShowForm(false);
      setImageFile(null);
      setFormData({
        nick: '',
        firstname: '',
        surname: '',
        age: '',
        sex: '',
        password: '',
        department: '',
      });

    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false)
    }

  };

  const getFilteredAndSortedUsers = () => {
    return [...users]
      .filter((user) => {
        if (!search) return true;
        const searchLower = search.toLowerCase();

        if (sortField === 'age') {
          const ageStr = user.age !== null && user.age !== undefined ? String(user.age) : '';
          return ageStr.includes(searchLower);
        }

        return (user[sortField] ?? '').toString().toLowerCase().includes(searchLower);
      })


      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        // 🔢 SORTOWANIE PO WIEKU (liczby)
        if (sortField === 'age') {
          valA = valA == null ? -Infinity : Number(valA);
          valB = valB == null ? -Infinity : Number(valB);

          return sortOrder === 'asc' ? valA - valB : valB - valA;
        }

        // 🔤 SORTOWANIE TEKSTOWE
        valA = (valA ?? '').toString().toLowerCase();
        valB = (valB ?? '').toString().toLowerCase();

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  };

  const filteredAndSortedUsers = getFilteredAndSortedUsers();
  const totalRecords = filteredAndSortedUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  useEffect(() => {
    if (page < 1 || page > totalPages) {
      setSearchParams(prev => {
        prev.set("page", currentPage);
        return prev;
      }, { replace: true });
    }
  }, [page, currentPage, totalPages, setSearchParams]);

  const paginatedUsers = filteredAndSortedUsers.slice(
    (currentPage - 1) * limit,
    currentPage * limit
  );

  const setPage = (newPage) => {
    setSearchParams(prev => {
      prev.set("page", newPage);
      return prev;
    });
  };

  const setLimit = (newLimit) => {
    setSearchParams(prev => {
      prev.set("limit", newLimit);
      prev.set("page", 1);
      return prev;
    });
  };

  const handleJumpPage = () => {
    const target = parseInt(jumpPageInput, 10);
    if (!isNaN(target) && target >= 1 && target <= totalPages) {
      setPage(target);
      setJumpPageInput('');
    } else {
      alert(`Wprowadź poprawny numer strony od 1 do ${totalPages}`);
    }
  };

  return (
    <div className="data-file-page">
      <h1 style={{ padding: '1em' }} className='title'>Lista użytkowników</h1>
      <div className="top-bar">
        <div className="left-controls">
          <input
            className="input"
            type="text"
            placeholder="Szukaj po nicku lub nazwisku..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>

            <select
              className="input"
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
            >
              <option value="nick">Nick</option>
              <option value="firstname">Imię</option>
              <option value="surname">Nazwisko</option>
              <option value="age">Wiek</option>
              <option value="department">Dział</option>
            </select>

            {sortField === 'age' && (
              <select
                className="input"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="asc">Rosnąco</option>
                <option value="desc">Malejąco</option>
              </select>
            )}

          </div>
        </div>
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

        <button
          className='primary-btn'
          onClick={() => setShowFightingMode(true)}
        >
          ⚔️ Fighting Mode
        </button>

      </div>
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
              className='input'
              name="nick"
              placeholder="Nick *"
              value={formData.nick}
              onChange={handleFormChange}
              required
            />
            <input
              className='input'
              name="firstname"
              placeholder="Imie *"
              value={formData.firstname}
              onChange={handleFormChange}
              required
            />
            <input
              className='input'
              name="surname"
              placeholder="Nazwisko *"
              value={formData.surname}
              onChange={handleFormChange}
              required
            />
            <input
              className='input'
              name="age"
              placeholder="Wiek"
              value={formData.age}
              onChange={handleFormChange}
              type="number"
              min="0"
              max="120"
            />
            <input
              className='input'
              name="sex"
              placeholder="Płeć (np. M / K / inne) *"
              value={formData.sex}
              onChange={handleFormChange}
              required
            />
            <input
              className='input'
              name="password"
              placeholder="Hasło *"
              type="password"
              value={formData.password}
              onChange={handleFormChange}
              required
            />
            <input
              className='input'
              name="department"
              placeholder="Wydział / Dział *"
              value={formData.department}
              onChange={handleFormChange}
              required
            />

            <div
              className={`avatar-upload-zone ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <label style={{ cursor: 'pointer', display: 'block', width: '100%' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
                {imageFile ? (
                  <div className="avatar-preview-container">
                    <img src={URL.createObjectURL(imageFile)} alt="Preview" className="avatar-upload-preview" />
                    <span>{imageFile.name}</span>
                  </div>
                ) : (
                  <div>🖼️ Przeciągnij i upuść avatar lub kliknij, aby wybrać</div>
                )}
              </label>
            </div>

            <div className='form-actions'>
              <button
                onClick={submitForm}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Zapisywanie...' : 'Zapisz'}
              </button>
              <button
                className='secondary-btn'
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
            <th>Avatar</th>
            <th>Nick</th>
            <th>Imie</th>
            <th>Nazwisko</th>
            <th>Wiek</th>
            <th>Płeć</th>
            <th>Dział</th>
            <th>Akcja</th>
            <th>Usuń</th>
          </tr>
        </thead>
        <tbody>
          {paginatedUsers.map((user) => (
            <tr key={user.nick}>
              <td>
                <img
                  src={user.image ? `${API_BASE_URL}/media/${user.image}` : '/default-avatar.png'}

                  alt="avatar"
                  className="avatar"
                />
              </td>
              <td >{user.nick}</td>
              <td >{user.firstname}</td>
              <td >{user.surname}</td>
              <td >{user.age ?? '-'}</td>
              <td >{user.sex}</td>
              <td >{user.department}</td>

              <td>
                <button
                  onClick={() => navigate(`/login`, { state: { nick: user.nick } })}
                >
                  Log in
                </button>
              </td>
              <td>
                <button onClick={() => handleDeleteClick(user.nick)}>
                  remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ✅ KONTROLKA STRONICOWANIA */}
      <div className="pagination-container">
        <div className="pagination-limit">
          <span>Pozycji na stronę:</span>
          <select
            className="input pagination-select"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="pagination-nav">
          <button
            className="pagination-btn"
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ◀ Poprzednia
          </button>
          
          <div className="pagination-pages">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`pagination-page-btn ${currentPage === p ? 'active' : ''}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            className="pagination-btn"
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Następna ▶
          </button>
        </div>

        <div className="pagination-jump">
          <span>Skocz do strony:</span>
          <input
            type="number"
            min="1"
            max={totalPages}
            className="input pagination-jump-input"
            value={jumpPageInput}
            onChange={(e) => setJumpPageInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleJumpPage();
              }
            }}
          />
          <button className="pagination-btn" onClick={handleJumpPage}>
            Idź
          </button>
        </div>
      </div>

      {showFightingMode && (
        <div className="modal-overlay">
          <div className="modal-content">

            <button
              className="close-btn"
              onClick={() => setShowFightingMode(false)}
            >
              ❌
            </button>
            <FightingMode
              users={users}
            />

          </div>
        </div>
      )}

      {users.length === 0 && (
        <p>Brak rekordów</p>
      )}

      {deleteTarget && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <h3>Usuń użytkownika „{deleteTarget}"</h3>
            <p>Wpisz hasło użytkownika, aby potwierdzić usunięcie:</p>
            {deleteError && <div className="error-box">{deleteError}</div>}
            <input
              className="input"
              type="password"
              placeholder="Hasło"
              value={deletePassword}
              onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleDeleteConfirm()}
              autoFocus
            />
            <div className="form-actions" style={{ marginTop: '12px' }}>
              <button onClick={handleDeleteConfirm} disabled={isDeleting}>
                {isDeleting ? 'Usuwanie...' : 'Usuń'}
              </button>
              <button
                className="secondary-btn"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataFilePage;