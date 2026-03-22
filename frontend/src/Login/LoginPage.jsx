import {useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import API_BASE_URL from "../utils/config"; 
import './LoginPage.css';

const LoginPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const nickFromState = location.state?.nick || '';
  const [nick, setUsernick] = useState(nickFromState);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/login/`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({nick, password}),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Nie można się zalogować');

      navigate(`/view/${data.nick}`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className='login-page'>
      <div className='login-card'>
        <h2 className='login-title'>Logowanie</h2>

        <p className="login-username">
          Nick: <strong>{nick}</strong>
        </p>

        {error && <div className='login-error'>{error}</div>}
        <input 
          className='login-input'
          type='password'
          placeholder='Password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className='login-btn' onClick={handleLogin}>
          Zaloguj
        </button>
      </div>
    </div>
  );


};

export default LoginPage;