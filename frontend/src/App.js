// src/App.jsx – FINALNA WERSJA Z TWOIM PROGRESS BAREM + RUCHOMY POPUP
import React, { useContext, useRef, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './Login/LoginPage';
import DataFilePage from './DataFile/DataFilePage';
import ViewPage from './View/ViewPage';
import './DataFile/DataFilePage.css'; // Twój piękny CSS!

function App() {
  return (
    <UploadProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/datafiles" element={<DataFilePage />} />
          <Route path="/view/:studyId" element={<ViewPage />} />
        </Routes>
        <GlobalUploadPopup />
      </Router>
    </UploadProvider>
  );
}

export default App;