import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      sessionStorage.setItem('@PedCurve:prof', '1');
      navigate('/dashboard');
    }
  };

  return (
    <div className="login-split">
      <div className="login-side">
        <Logo size={38} withWordmark variant="mono" />
        <p className="login-quote">
          “O que medimos em <em>centímetros</em>, as famílias guardam em
          memórias.”
        </p>
        <p className="login-meta">
          Percentis e Escore-Z calculados automaticamente sobre as tabelas
          oficiais da OMS e do CDC, a cada consulta registrada.
        </p>
      </div>

      <div className="login-main">
        <div className="login-box">
          <div className="login-topbar">
            <button className="login-back" onClick={() => navigate('/')}>
              <ArrowLeft size={15} /> Voltar
            </button>
            <ThemeToggle className="theme-toggle-light" />
          </div>

          <span className="login-area-chip">ÁREA DO PROFISSIONAL</span>
          <h2>Que bom ter você de volta.</h2>
          <p className="login-sub">Entre para acessar seus pacientes e consultas.</p>

          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>E-mail</label>
              <input
                type="email"
                placeholder="dra@clinica.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Senha</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-full mt-4">
              Entrar no consultório <ArrowRight size={16} />
            </button>

            <p className="text-xs text-muted text-center mt-2">
              Versão demo — qualquer credencial é aceita.
            </p>
          </form>

          <p className="login-alt">
            É pai ou responsável?{' '}
            <button onClick={() => navigate('/parent')}>Use seu código de acesso</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
