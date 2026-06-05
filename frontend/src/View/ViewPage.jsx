import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import API_BASE_URL from "../utils/config";
import { parseUserData, calculateStepsData, calculateAverage } from "../utils/dataUtils";
import './ViewPage.css';

import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, BarChart, Bar
} from "recharts";

const ViewPage = () => {
  const { nick } = useParams();
  const [userData, setUserData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [correlations, setCorrelations] = useState(null);

  const [activeTab, setActiveTab] = useState("charts"); // ✅ TABS

  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.name.endsWith('.json')) {
        setSelectedFile(file);
        setErrorMessage('');
      } else {
        setErrorMessage('Dozwolone są tylko pliki z rozszerzeniem .json');
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
      if (file.name.endsWith('.json')) {
        setSelectedFile(file);
        setErrorMessage('');
      } else {
        setErrorMessage('Dozwolone są tylko pliki z rozszerzeniem .json');
      }
    }
  };

  const fetchCorrelations = async () => {
    if (!chartData.length) return;

    const payload = {
      sleep: chartData.map(d => d.sleep),
      stress: chartData.map(d => d.stress),
      quality: chartData.map(d => d.quality),
      activity: chartData.map(d => d.activity),
    };

    console.log("payload:", payload);

    try {
      const res = await fetch(`${API_BASE_URL}/api/correlation/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setCorrelations(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserData = async () => {
    if (!nick) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/get-user-records/${nick}/`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Błąd pobierania");

      setUserData(data);
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

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

      await fetchUserData();
      setSelectedFile(null);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [nick]);

  const chartData = useMemo(() => parseUserData(userData), [userData]);


  const dateMap = Object.fromEntries(
    chartData.map(d => [d.x, d.date])
  );

  const stepsData = useMemo(() => calculateStepsData(userData), [userData]);

  const avg = (key) => calculateAverage(chartData, key);

  useEffect(() => {
    if (chartData.length > 0) {
      fetchCorrelations();
    }
  }, [chartData]);

  const handleExportCSV = () => {
    if (!chartData || chartData.length === 0) return;

    const headers = ["Data", "Sen (godziny)", "Jakość Snu", "Poziom Stresu", "Poziom Aktywności"];
    const rows = chartData.map(d => [
      d.date,
      d.sleep ?? "",
      d.quality ?? "",
      d.stress ?? "",
      d.activity ?? ""
    ]);

    const csvContent = "\uFEFF" + [
      headers.join(";"),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(";"))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `dane_eksport_${nick || "uzytkownik"}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="view-page">
      <h1>Witaj w aplikacji HealthMonitoring!</h1>

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      <div
        className={`upload-card ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <h3>Zarządzanie Danymi</h3>
        <div className="upload-actions">
          <label className="custom-file-upload">
            <input type="file" onChange={handleFileChange} accept=".json" style={{ display: 'none' }} />
            📂 {selectedFile ? selectedFile.name : "Prześlij plik JSON"}
          </label>
          <button
            className="btn-primary"
            onClick={() => handleUpload(nick)}
            disabled={isUploading || !selectedFile}
          >
            {isUploading ? 'Wysyłanie...' : 'Załaduj dane'}
          </button>
          <button
            className="btn-secondary"
            onClick={handleExportCSV}
            disabled={chartData.length === 0}
          >
            📥 Eksportuj dane
          </button>
        </div>
      </div>

      {/* ✅ TABS */}
      {userData && (
        <>
          <div className="tabs">
            <button
              className={activeTab === "charts" ? "active" : ""}
              onClick={() => setActiveTab("charts")}
            >
              📊 Wykresy
            </button>

            <button
              className={activeTab === "stats" ? "active" : ""}
              onClick={() => setActiveTab("stats")}
            >
              📈 Statystyki
            </button>
          </div>

          {/* ✅ STATYSTYKI */}
          {activeTab === "stats" && (
            <>
              <div className="kpi-grid">
                <div className="kpi-card">😴 Sen: {avg("sleep")}</div>
                <div className="kpi-card">⭐ Jakość: {avg("quality")}</div>
                <div className="kpi-card">🔥 Stres: {avg("stress")}</div>
                <div className="kpi-card">🏃 Aktywność: {avg("activity")}</div>
              </div>

              {correlations && correlations.correlations && (
                <div className="correlations chart-box" style={{ maxWidth: "800px", margin: "20px auto" }}>
                  <h3>Korelacje</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      layout="vertical"
                      data={Object.entries(correlations.correlations).map(([key, value]) => ({
                        name: key,
                        value: value,
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        type="number"
                        domain={[-1, 1]}
                        tickFormatter={(val) => val.toFixed(3)}
                      />
                      <YAxis dataKey="name" type="category" />
                      <Tooltip formatter={(value) => value.toFixed(4)} />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}

          {/* ✅ WYKRESY */}
          {activeTab === "charts" && (
            <div className="charts-grid">

              <div className="chart-box">
                <h3>😴 Sen</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="x"
                      tickFormatter={(value) => dateMap[value]?.slice(0, 10) || value}
                    />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="sleep" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-box">
                <h3>⭐ Jakość</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="x"
                      tickFormatter={(value) => dateMap[value]?.slice(0, 10) || value}
                    />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="quality" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-box">
                <h3>🔥 Stres</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="x"
                      tickFormatter={(value) => dateMap[value]?.slice(0, 10) || value}
                    />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="stress" stroke="#ef4444" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-box">
                <h3>🏃 Aktywność</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="x"
                      tickFormatter={(value) => dateMap[value]?.slice(0, 10) || value}
                    />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="activity" stroke="#f59e0b" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-box">
                <h3>📊 Sen vs Stres</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="x"
                      tickFormatter={(value) => dateMap[value]?.slice(0, 10) || value}
                    />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="sleep" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="stress" stroke="#ef4444" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-box">
                <h3>👣 Kroki</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={stepsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="x"
                      tickFormatter={(value) => {
                        const point = stepsData.find(d => d.x === value);
                        return point?.date ? point.date.slice(0, 10) : value;
                      }}
                    />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="steps" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 2 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ViewPage;