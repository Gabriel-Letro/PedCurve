import React from 'react';
import { HashRouter, Routes, Route, Navigate, useSearchParams, useParams } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import ParentLogin from './pages/ParentLogin';
import Dashboard from './pages/Dashboard';
import PatientProfile from './pages/PatientProfile';
import CurveGenerator from './pages/CurveGenerator';
import AppShell from './components/AppShell';

function isProfLoggedIn(): boolean {
  return sessionStorage.getItem('@PedCurve:prof') === '1';
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return isProfLoggedIn() ? <AppShell>{children}</AppShell> : <Navigate to="/login" replace />;
}

function PatientProfileRoute() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  if (searchParams.get('view') === 'parent') {
    const authorizedId = sessionStorage.getItem('@PedCurve:parentPatientId');
    if (!authorizedId || authorizedId !== id) return <Navigate to="/parent" replace />;
    return <PatientProfile />;
  }
  if (!isProfLoggedIn()) return <Navigate to="/login" replace />;
  return <AppShell><PatientProfile /></AppShell>;
}

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/parent" element={<ParentLogin />} />
        <Route path="/generator" element={<ProtectedRoute><CurveGenerator /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/patient/:id" element={<PatientProfileRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
