import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './Login/LoginPage';
import ListPage from './PatientList/ListPage';
import ViewPage from './View/ViewPage';
// import './DataFile/DataFilePage.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ListPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/view/:nick" element={<ViewPage />} />
      </Routes>
    </Router>
  );
}

export default App;