import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useSearchParams, useParams } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import ParentLogin from './pages/ParentLogin';
import Dashboard from './pages/Dashboard';
import PatientProfile from './pages/PatientProfile';
import CurveGenerator from './pages/CurveGenerator';

function isProfLoggedIn(): boolean {
  return sessionStorage.getItem('@PedCurve:prof') === '1';
}

function ProtectedProfRoute({ element }: { element: React.ReactElement }) {
  return isProfLoggedIn() ? element : <Navigate to="/login" replace />;
}

function PatientProfileRoute() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  if (searchParams.get('view') === 'parent') {
    const authorizedId = sessionStorage.getItem('@PedCurve:parentPatientId');
    if (!authorizedId || authorizedId !== id) return <Navigate to="/parent" replace />;
    return <PatientProfile />;
  }
  return isProfLoggedIn() ? <PatientProfile /> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/parent" element={<ParentLogin />} />
            <Route path="/generator" element={<ProtectedProfRoute element={<CurveGenerator />} />} />
            <Route path="/dashboard" element={<ProtectedProfRoute element={<Dashboard />} />} />
            <Route path="/patient/:id" element={<PatientProfileRoute />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
