import React, { useState } from 'react';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import { Users, TrendingUp, LogOut, Sun, Moon, Menu, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface AppShellProps {
  children: React.ReactNode;
}

const StethoscopeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
    <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
    <circle cx="20" cy="10" r="2" />
  </svg>
);

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const navigate = useNavigate();
  useLocation();
  const { theme, toggle } = useTheme();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 900);

  const handleLogout = () => {
    sessionStorage.removeItem('@PedCurve:prof');
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Pacientes', icon: <Users size={17} className="nav-item-icon" /> },
    { to: '/generator', label: 'Gerador de Curvas', icon: <TrendingUp size={17} className="nav-item-icon" /> },
  ];

  return (
    <div className={`app-shell${sidebarOpen ? '' : ' sidebar-collapsed'}`}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className="app-sidebar">
        {/* Logo */}
        <div className="sidebar-logo-section">
          <div className="sidebar-logo-icon">
            <StethoscopeIcon />
          </div>
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-name">PedCurve</span>
            <span className="sidebar-logo-sub">Curvas de crescimento</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <span className="sidebar-section-label">Principal</span>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-doctor-row">
            <div className="sidebar-avatar">C</div>
            <div>
              <div className="sidebar-doctor-name">Dra. Camila</div>
              <div className="sidebar-doctor-sub">Pediatra</div>
            </div>
          </div>
          <div className="sidebar-footer-row">
            <button
              className="sidebar-logout-btn"
              onClick={() => setShowLogoutModal(true)}
            >
              <LogOut size={14} />
              Sair
            </button>
            <button
              className="theme-toggle"
              onClick={toggle}
              title={theme === 'light' ? 'Modo escuro' : 'Modo claro'}
              aria-label={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <main className="shell-main">
        {/* Mobile hamburger toggle */}
        <button
          className="sidebar-hamburger"
          onClick={() => setSidebarOpen((o) => !o)}
          aria-label={sidebarOpen ? 'Fechar menu' : 'Abrir menu'}
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
        {children}
      </main>

      {/* Logout confirmation modal */}
      {showLogoutModal && (
        <div className="modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 360 }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Sair do sistema</h3>
            <p className="text-sm text-muted" style={{ marginBottom: '1.25rem' }}>
              Deseja encerrar sua sessão? Você precisará fazer login novamente para acessar o sistema.
            </p>
            <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowLogoutModal(false)}>
                Cancelar
              </button>
              <button className="btn btn-danger" onClick={handleLogout}>
                <LogOut size={15} /> Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppShell;
