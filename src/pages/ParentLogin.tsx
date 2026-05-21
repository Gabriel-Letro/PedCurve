import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, KeyRound } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import Logo from '../components/Logo';

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
      navigate(`/patient/${patient.id}?view=parent`);
    } else {
      setError('Código inválido. Verifique com o profissional de saúde.');
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
          <h2 className="text-2xl font-bold text-dark mt-3">Acesso dos Pais</h2>
          <p className="text-muted text-sm mt-1">
            Informe o código fornecido pelo profissional para visualizar o
            desenvolvimento do seu filho(a).
          </p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Código de Acesso</label>
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
                fontWeight: 600,
              }}
            />
          </div>

          {error && (
            <p className="text-sm text-center" style={{ color: 'var(--color-accent)' }}>
              {error}
            </p>
          )}

          <button type="submit" className="btn btn-primary w-full mt-4">
            <KeyRound size={18} /> Acessar Perfil
          </button>

          <p
            className="text-xs text-muted text-center mt-2 flex items-center justify-center gap-1"
          >
            <Heart size={12} /> Acesso somente-leitura, sem edição de dados.
          </p>
        </form>
      </div>
    </div>
  );
};

export default ParentLogin;
