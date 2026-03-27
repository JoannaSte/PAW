import { useState } from "react";
import { useParams } from "react-router-dom";
import API_BASE_URL from "../utils/config";
import './ViewPage.css'; // możesz dodać własne style

const ViewPage = () => {
  const { nick } = useParams();
  const [userData, setUserData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Obsługa wyboru pliku
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setErrorMessage('');
  };

  // Upload pliku do backendu
  const handleUpload = async (nickValue) => {
    if (!nickValue?.trim()) {
      setErrorMessage("Brak nick w adresie URL");
      return;
    }
    if (!selectedFile) {
      setErrorMessage("Wybierz plik do przesłania");
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    setIsUploading(true);
    setErrorMessage('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/upload-study/${encodeURIComponent(nickValue.trim())}/`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Błąd przesyłania pliku");

      setUserData(data); // zapisujemy odpowiedź backendu
      setSelectedFile(null);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="view-page">
      <h1>Witaj na stronie widoku!</h1>
      <p>Tu będzie wyświetlana zawartość po zalogowaniu.</p>

      <h3>Załaduj swoje dane</h3>
      {errorMessage && <p className="error-message">{errorMessage}</p>}

      <input
        type="file"
        onChange={handleFileChange}
        accept=".json"
      />
      <button onClick={() => handleUpload(nick)} disabled={isUploading}>
        {isUploading ? 'Wysyłanie...' : 'Załaduj dane'}
      </button>

      {userData && (
        <div className="uploaded-data">
          <h4>Otrzymane dane:</h4>
          <pre>{JSON.stringify(userData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default ViewPage;