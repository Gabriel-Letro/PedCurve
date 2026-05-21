import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Stethoscope } from 'lucide-react';
import Logo from '../components/Logo';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login — accepts any non-empty credentials.
    if (email && password) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md card">
        <button
          onClick={() => navigate('/')}
          className="btn btn-ghost"
          style={{ background: 'transparent', padding: 0, marginBottom: '1.25rem' }}
        >
          <ArrowLeft size={18} /> Voltar
        </button>

        <div className="text-center mb-6">
          <div style={{ display: 'inline-flex' }}>
            <Logo size={56} />
          </div>
          <h2 className="text-2xl font-bold text-dark mt-3">
            Acesso do Profissional
          </h2>
          <p className="text-muted text-sm mt-1">
            Entre para gerenciar pacientes e avaliações.
          </p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>E-mail</label>
            <input
              type="email"
              placeholder="dr@exemplo.com"
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
            <Stethoscope size={18} /> Entrar
          </button>

          <p className="text-xs text-muted text-center mt-2">
            Versão demo — qualquer credencial é aceita.
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
