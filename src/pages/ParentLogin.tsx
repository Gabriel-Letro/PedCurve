import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Heart } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';

const ParentLogin: React.FC = () => {
  const navigate = useNavigate();
  const { getPatientByAccessCode } = useAppContext();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    const patient = getPatientByAccessCode(code.trim());
    if (patient) {
      sessionStorage.setItem('@PedCurve:parentPatientId', patient.id);
      navigate(`/patient/${patient.id}?view=parent`);
    } else {
      setError('Código inválido. Verifique com o profissional de saúde.');
    }
  };

  return (
    <div className="login-split">
      <div className="login-side">
        <Logo size={38} withWordmark variant="mono" />
        <p className="login-quote">
          Cada consulta vira um ponto. Cada ponto, um pedaço da{' '}
          <em>história</em> do seu filho.
        </p>
        <p className="login-meta">
          Acesso somente-leitura: você vê o crescimento registrado pelo
          profissional de saúde, sem cadastro e sem senha.
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

          <span className="login-area-chip coral">ÁREA DA FAMÍLIA</span>
          <h2>Veja o crescimento do seu filho.</h2>
          <p className="login-sub">
            Digite o código que você recebeu na consulta — tipo{' '}
            <b>HELENA1</b>.
          </p>

          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Código de acesso</label>
              <input
                type="text"
                placeholder="EX: A8F3K2"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError('');
                }}
                required
                maxLength={10}
                style={{
                  textAlign: 'center',
                  fontSize: '1.25rem',
                  letterSpacing: '0.3em',
                  fontWeight: 700,
                  fontFamily: "ui-monospace, 'Cascadia Code', monospace",
                }}
              />
            </div>

            {error && (
              <p className="text-sm text-center" style={{ color: 'var(--color-danger-cl)' }}>
                {error}
              </p>
            )}

            <button type="submit" className="btn btn-coral w-full mt-4">
              Ver o crescimento <ArrowRight size={16} />
            </button>

            <p className="text-xs text-muted text-center mt-2 flex items-center justify-center gap-1">
              <Heart size={12} /> Acesso somente-leitura, sem edição de dados.
            </p>
          </form>

          <p className="login-alt">
            É profissional de saúde?{' '}
            <button onClick={() => navigate('/login')}>Entre por aqui</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ParentLogin;
