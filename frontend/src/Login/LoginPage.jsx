import {useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import API_BASE_URL from "../utils/config"; 


const LoginPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const usernameFromState = location.state?.username || '';
  const [username, setUsername] = useState(usernameFromState);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/login/`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username, password}),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Nie można się zalogować');

      navigate(`/view/${data.username}`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
      <h2>Logowanie</h2>
      <p>Username: <strong>{username}</strong></p>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <input 
        type='password'
        placeholder='Password'
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Zaloguj</button>
    </div>
  );


};

export default LoginPage;