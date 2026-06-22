import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import API_BASE_URL from "../utils/config";
import { parseUserData, calculateStepsData, calculateAverage } from "../utils/dataUtils";
import './ViewPage.css';

import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, BarChart, Bar, Cell
} from "recharts";

// Mapowanie technicznych nazw par na czytelne polskie opisy
// Klucze odpowiadają dokładnie temu, co zwraca backend (/api/correlation/)
const CORRELATION_LABELS = {
  "stress_sleep":    { label: "Stres ↔ Sen",              desc: "Czy wyższy stres wiąże się z krótszym snem?",        hint: "Wysoki stres często opóźnia zasypianie i skraca całkowity czas snu. Techniki relaksacyjne przed snem mogą znacząco poprawić sytuację." },
  "stress_quality":  { label: "Stres ↔ Jakość snu",       desc: "Czy wysoki stres pogarsza jakość snu?",              hint: "Wyższy stres wyraźnie pogarsza jakość snu — to typowy wzorzec. Redukcja stresu powinna poprawić wypoczynek." },
  "stress_activity": { label: "Stres ↔ Aktywność",        desc: "Czy ćwiczenia redukują poziom stresu?",              hint: "Regularna aktywność fizyczna to jeden z najskuteczniejszych sposobów redukcji stresu. Wysiłek sprzyja wydzielaniu endorfin i poprawia nastrój." },
  "sleep_stress":    { label: "Sen ↔ Stres",              desc: "Czy więcej snu wiąże się z niższym stresem?" },
  "sleep_quality":   { label: "Sen ↔ Jakość snu",         desc: "Czy dłuższy sen oznacza lepszą jego jakość?" },
  "sleep_activity":  { label: "Sen ↔ Aktywność",          desc: "Czy aktywność fizyczna wpływa na długość snu?" },
  "quality_activity":{ label: "Jakość snu ↔ Aktywność",   desc: "Czy aktywność fizyczna poprawia jakość snu?" },
};

// Interpretacja słowna wartości korelacji Pearsona
const interpretCorrelation = (val) => {
  const abs = Math.abs(val);
  const dir = val >= 0 ? "dodatnia" : "ujemna";
  if (abs >= 0.8) return { strength: "Bardzo silna", dir, color: val >= 0 ? "#22c55e" : "#ef4444", emoji: val >= 0 ? "💚" : "❤️" };
  if (abs >= 0.6) return { strength: "Silna",        dir, color: val >= 0 ? "#4ade80" : "#f87171", emoji: val >= 0 ? "🟢" : "🔴" };
  if (abs >= 0.4) return { strength: "Umiarkowana",  dir, color: val >= 0 ? "#facc15" : "#fb923c", emoji: val >= 0 ? "🟡" : "🟠" };
  if (abs >= 0.2) return { strength: "Słaba",        dir, color: "#94a3b8", emoji: "⚪" };
  return              { strength: "Brak / znikoma", dir, color: "#64748b", emoji: "➖" };
};

// Własny tooltip dla wykresu korelacji
const CustomCorrelationTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const { name, value } = payload[0].payload;
  const meta = CORRELATION_LABELS[name] || { label: name, desc: "" };
  const interp = interpretCorrelation(value);

  return (
    <div style={{
      background: "rgba(15, 10, 40, 0.95)",
      border: `1px solid ${interp.color}`,
      borderRadius: "14px",
      padding: "14px 18px",
      color: "white",
      maxWidth: "280px",
      boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 12px ${interp.color}44`,
      fontSize: "13px",
      lineHeight: "1.6",
    }}>
      <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "6px" }}>
        {meta.label}
      </div>
      <div style={{ color: "rgba(255,255,255,0.7)", marginBottom: "10px", fontStyle: "italic" }}>
        {meta.desc}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
        <span style={{ fontSize: "20px" }}>{interp.emoji}</span>
        <span style={{ color: interp.color, fontWeight: 700, fontSize: "15px" }}>
          {interp.strength} ({interp.dir})
        </span>
      </div>
      <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "8px", padding: "8px 10px", marginBottom: "8px" }}>
        <span style={{ color: "rgba(255,255,255,0.6)" }}>Wartość r = </span>
        <span style={{ color: interp.color, fontWeight: 700 }}>{value.toFixed(4)}</span>
      </div>
      {meta.hint && (
        <div style={{
          background: `${interp.color}18`,
          border: `1px solid ${interp.color}44`,
          borderRadius: "8px",
          padding: "8px 10px",
          marginBottom: "8px",
          color: "rgba(255,255,255,0.85)",
          fontSize: "12px",
          lineHeight: "1.5",
          fontStyle: "italic",
        }}>
          💡 {meta.hint}
        </div>
      )}
      <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "11px", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "8px" }}>
        📐 Skala: <strong style={{color:"#22c55e"}}>+1</strong> = idealna korelacja dodatnia &nbsp;|&nbsp;
        <strong style={{color:"#ef4444"}}>−1</strong> = idealna ujemna &nbsp;|&nbsp;
        <strong style={{color:"#94a3b8"}}>0</strong> = brak zależności
      </div>
    </div>
  );
};

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

              {correlations && correlations.correlations && (() => {
                const corrData = Object.entries(correlations.correlations).map(([key, value]) => ({
                  name: key,
                  label: CORRELATION_LABELS[key]?.label || key,
                  value,
                }));
                return (
                  <div className="correlations chart-box" style={{ maxWidth: "800px", margin: "20px auto" }}>
                    <h3>📊 Korelacje między zmiennymi</h3>
                    <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "13px", marginBottom: "16px", marginTop: "-4px" }}>
                      Najedź kursorem na słupek, aby zobaczyć szczegółową interpretację. Wartości bliskie <strong style={{color:"#22c55e"}}>+1</strong> oznaczają silną zależność dodatnią, bliskie <strong style={{color:"#ef4444"}}>−1</strong> — silną ujemną, a bliskie <strong style={{color:"#94a3b8"}}>0</strong> — brak zależności.
                    </p>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        layout="vertical"
                        data={corrData}
                        margin={{ top: 10, right: 40, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                          type="number"
                          domain={[-1, 1]}
                          tickFormatter={(val) => val.toFixed(1)}
                          tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
                        />
                        <YAxis
                          dataKey="label"
                          type="category"
                          width={160}
                          tick={{ fill: "rgba(255,255,255,0.85)", fontSize: 12 }}
                        />
                        <Tooltip content={<CustomCorrelationTooltip />} />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                          {corrData.map((entry) => (
                            <Cell
                              key={entry.name}
                              fill={interpretCorrelation(entry.value).color}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                );
              })()}
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