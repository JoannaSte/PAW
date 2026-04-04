// import { useState, useEffect } from "react";
// import { useParams } from "react-router-dom";
// import API_BASE_URL from "../utils/config";
// import './ViewPage.css';

// import {
//   LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
// } from "recharts";

// const ViewPage = () => {
//   const { nick } = useParams();
//   const [userData, setUserData] = useState(null);
//   const [errorMessage, setErrorMessage] = useState('');
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [isUploading, setIsUploading] = useState(false);
//   const [correlations, setCorrelations] = useState(null);

//   const handleFileChange = (e) => {
//     setSelectedFile(e.target.files[0]);
//     setErrorMessage('');
//   };

//   const fetchCorrelations = async () => {
//     if (!chartData.length) return;

//     const payload = {
//       sleep: chartData.map(d => d.sleep),
//       stress: chartData.map(d => d.stress),
//       quality: chartData.map(d => d.quality),
//       activity: chartData.map(d => d.activity),
//     };

//     try {
//       const res = await fetch(`${API_BASE_URL}/api/correlation`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(payload),
//       });

//       const data = await res.json();
//       setCorrelations(data);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const handleUpload = async (nickValue) => {
//     if (!nickValue?.trim()) {
//       setErrorMessage("Brak nick w adresie URL");
//       return;
//     }
//     if (!selectedFile) {
//       setErrorMessage("Wybierz plik do przesłania");
//       return;
//     }

//     const formData = new FormData();
//     formData.append('file', selectedFile);

//     setIsUploading(true);
//     setErrorMessage('');

//     try {
//       const res = await fetch(`${API_BASE_URL}/api/upload-study/${encodeURIComponent(nickValue.trim())}/`, {
//         method: 'POST',
//         body: formData,
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error || "Błąd przesyłania pliku");

//       setUserData(data);
//       setSelectedFile(null);
//     } catch (err) {
//       setErrorMessage(err.message);
//     } finally {
//       setIsUploading(false);
//     }
//   };

//   useEffect(() => {
//     if (!nick) return;

//     const fetchData = async () => {
//       try {
//         const res = await fetch(`${API_BASE_URL}/api/get-user-records/${nick}/`);
//         const data = await res.json();

//         if (!res.ok) throw new Error(data.error || "Błąd pobierania");

//         setUserData(data);
//       } catch (err) {
//         setErrorMessage(err.message);
//       }
//     };

//     fetchData();
//   }, [nick]);

//   const activityMap = {
//     "Low": 1,
//     "Moderately Active": 2,
//     "Highly Active": 3,
//   };

//   const chartData = Array.isArray(userData)
//     ? userData.map(r => ({
//         date: r.date || r.record_date || "brak daty",
//         sleep: Number(r.sleep) || Number(r.sleep_hours) || 0,
//         stress: Number(r.stress) || Number(r.stress_level) || 0,
//         quality: Number(r.quality) || Number(r.sleep_quality_score) || 0,
//         activity: activityMap[r.activity_level] || 0,
//       }))
//     : [];

//   useEffect(() => {
//     if (chartData.length > 0) {
//       fetchCorrelations();
//     }
//   }, [chartData]);

//   // ✅ POPRAWIONE KROKI
//   const stepsData = Array.isArray(userData)
//   ? userData.flatMap((r, dayIndex) =>
//       (r.hourly_steps_vector || []).map((val, i) => ({
//         x: dayIndex * 24 + i,
//         steps: Number(val) || 0,
//         date: r.date || r.record_date || null, // 🔥 dodaj datę
//       }))
//     )
//   : [];
  
//   const avg = (key) =>
//     chartData.length
//       ? (chartData.reduce((sum, d) => sum + (d[key] || 0), 0) / chartData.length).toFixed(2)
//       : 0;

//   return (
//     <div className="view-page">
//       <h1>Witaj na stronie widoku!</h1>

//       {errorMessage && <p className="error-message">{errorMessage}</p>}

//       <div className="upload-card">
//         <input type="file" onChange={handleFileChange} accept=".json" />
//         <button onClick={() => handleUpload(nick)} disabled={isUploading}>
//           {isUploading ? 'Wysyłanie...' : 'Załaduj dane'}
//         </button>
//       </div>

//       {userData && (
//         <>
//           {/* KPI */}
//           <div className="kpi-grid">
//             <div className="kpi-card">😴 Sen: {avg("sleep")}</div>
//             <div className="kpi-card">⭐ Jakość: {avg("quality")}</div>
//             <div className="kpi-card">🔥 Stres: {avg("stress")}</div>
//             <div className="kpi-card">🏃 Aktywność: {avg("activity")}</div>
//           </div>

//           <div className="charts-grid">

//             <div className="chart-box">
//               <h3>😴 Sen</h3>
//               <ResponsiveContainer width="100%" height={250}>
//                 <LineChart data={chartData}>
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="date" />
//                   <YAxis />
//                   <Tooltip />
//                   <Line type="monotone" dataKey="sleep" />
//                 </LineChart>
//               </ResponsiveContainer>
//             </div>

//             <div className="chart-box">
//               <h3>⭐ Jakość</h3>
//               <ResponsiveContainer width="100%" height={250}>
//                 <LineChart data={chartData}>
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="date" />
//                   <YAxis />
//                   <Tooltip />
//                   <Line type="monotone" dataKey="quality" />
//                 </LineChart>
//               </ResponsiveContainer>
//             </div>

//             <div className="chart-box">
//               <h3>🔥 Stres</h3>
//               <ResponsiveContainer width="100%" height={250}>
//                 <LineChart data={chartData}>
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="date" />
//                   <YAxis />
//                   <Tooltip />
//                   <Line type="monotone" dataKey="stress" />
//                 </LineChart>
//               </ResponsiveContainer>
//             </div>

//             <div className="chart-box">
//               <h3>🏃 Aktywność</h3>
//               <ResponsiveContainer width="100%" height={250}>
//                 <LineChart data={chartData}>
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="date" />
//                   <YAxis />
//                   <Tooltip />
//                   <Line type="monotone" dataKey="activity" />
//                 </LineChart>
//               </ResponsiveContainer>
//             </div>

//             <div className="chart-box">
//               <h3>📊 Sen vs Stres</h3>
//               <ResponsiveContainer width="100%" height={250}>
//                 <LineChart data={chartData}>
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="date" />
//                   <YAxis />
//                   <Tooltip />
//                   <Line type="monotone" dataKey="sleep" />
//                   <Line type="monotone" dataKey="stress" />
//                 </LineChart>
//               </ResponsiveContainer>
//             </div>

//             {/* ✅ POPRAWIONY WYKRES KROKÓW */}
//             <div className="chart-box">
//               <h3>👣 Kroki</h3>
//               <ResponsiveContainer width="100%" height={250}>
//                 <LineChart data={stepsData}>
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis
//                     dataKey="x"
//                     tickFormatter={(x, index) => {
//                       const item = stepsData[index];
//                       return item?.date ? item.date : x;
//                     }}
//                   />
//                   <YAxis />
//                   <Tooltip
//                     formatter={(value) => [`${value} kroków`, "Kroki"]}
//                     labelFormatter={(label) => `Indeks: ${label}`}
//                   />
//                   <Line type="monotone" dataKey="steps" />
//                 </LineChart>
//               </ResponsiveContainer>
//             </div>

//           </div>
//         </>
//       )}
//     </div>
//   );
// };

// export default ViewPage;


import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import API_BASE_URL from "../utils/config";
import './ViewPage.css';

import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
} from "recharts";

const ViewPage = () => {
  const { nick } = useParams();
  const [userData, setUserData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [correlations, setCorrelations] = useState(null);

  const [activeTab, setActiveTab] = useState("charts"); // ✅ TABS

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setErrorMessage('');
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

      setUserData(data);
      setSelectedFile(null);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (!nick) return;

    const fetchData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/get-user-records/${nick}/`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Błąd pobierania");

        setUserData(data);
      } catch (err) {
        setErrorMessage(err.message);
      }
    };

    fetchData();
  }, [nick]);

  const activityMap = {
    "Low": 1,
    "Moderately Active": 2,
    "Highly Active": 3,
  };

  const chartData = useMemo(() => (
    Array.isArray(userData)
      ? userData.map((r, index) => {
          const sleep = Number(r.sleep ?? r.sleep_hours);
          const stress = Number(r.stress ?? r.stress_level);
          const quality = Number(r.quality ?? r.sleep_quality_score);
          const activity = activityMap[r.activity_level] || 0;

          return {
            x: index,
            date: r.date || r.record_date || "brak daty",
            sleep: isNaN(sleep) ? null : sleep,
            stress: isNaN(stress) ? null : stress,
            quality: isNaN(quality) ? null : quality,
            activity: isNaN(activity) ? null : activity,
          };
        })
      : []
  ), [userData]);


  const dateMap = Object.fromEntries(
    chartData.map(d => [d.x, d.date])
  );

  const stepsData = Array.isArray(userData)
  ? userData.flatMap((r, dayIndex) =>
      (r.hourly_steps_vector || []).map((val, i) => ({
        x: dayIndex * 24 + i,
        steps: Number(val) || 0,
        date: r.date || r.record_date,
      }))
    )
  : [];

  const avg = (key) =>
    chartData.length
      ? (chartData.reduce((sum, d) => sum + (d[key] || 0), 0) / chartData.length).toFixed(2)
      : 0;

  useEffect(() => {
    if (chartData.length > 0) {
      fetchCorrelations();
    }
  }, [chartData]);


  return (
    <div className="view-page">
      <h1>Witaj na stronie widoku!</h1>

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      <div className="upload-card">
        <input type="file" onChange={handleFileChange} accept=".json" />
        <button onClick={() => handleUpload(nick)} disabled={isUploading}>
          {isUploading ? 'Wysyłanie...' : 'Załaduj dane'}
        </button>
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

              {correlations && (
                <div className="correlations">
                  <h3>Korelacje</h3>
                  <pre>{JSON.stringify(correlations, null, 2)}</pre>
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
                    <Line type="monotone" dataKey="sleep" />
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
                    <Line type="monotone" dataKey="quality" />
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
                    <Line type="monotone" dataKey="stress" />
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
                    <Line type="monotone" dataKey="activity" />
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
                    <Line type="monotone" dataKey="sleep" />
                    <Line type="monotone" dataKey="stress" />
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
                    <Line type="monotone" dataKey="steps" />
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