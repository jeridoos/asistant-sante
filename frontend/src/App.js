import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';
import Register from './components/Register';
import VerifyEmail from './components/VerifyEmail';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import OldDashboard from './components/OldDashboard';   // ← import
import AddTreatment from './components/AddTreatment';
import './App.css';

function App() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  return (
    <NotificationProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify" element={<VerifyEmail />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route
            path="/dashboard"
            element={user ? <Dashboard user={user} /> : <Navigate to="/login" />}
          />
          <Route
            path="/old-dashboard"
            element={user ? <OldDashboard user={user} /> : <Navigate to="/login" />}
          />
          <Route
            path="/adherence"
            element={user ? <AddTreatment patientId={user.id} /> : <Navigate to="/login" />}
          />
        </Routes>
      </BrowserRouter>
    </NotificationProvider>
  );
}

export default App;