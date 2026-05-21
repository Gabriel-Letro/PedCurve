import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import ParentLogin from './pages/ParentLogin';
import Dashboard from './pages/Dashboard';
import PatientProfile from './pages/PatientProfile';

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/parent" element={<ParentLogin />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/patient/:id" element={<PatientProfile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
