import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Target, FileText, Users, Stethoscope, Heart } from 'lucide-react';
import Logo from '../components/Logo';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
      {/* Brand */}
      <div className="mb-6">
        <Logo size={72} withWordmark tagline />
      </div>

      <h2
        className="text-2xl font-semibold mb-3"
        style={{ maxWidth: 560 }}
      >
        Acompanhe o crescimento infantil com{' '}
        <span className="text-primary">precisão clínica</span>.
      </h2>
      <p
        className="text-muted mb-8"
        style={{ maxWidth: 520 }}
      >
        Plataforma para registro de consultas, geração automática de curvas de
        crescimento (OMS), cálculo de escore-Z e percentis, e compartilhamento
        seguro com os responsáveis.
      </p>

      {/* CTAs */}
      <div className="flex flex-col gap-3 w-full" style={{ maxWidth: 360 }}>
        <button
          className="btn btn-primary w-full"
          style={{ padding: '1rem 1.25rem', fontSize: '1.05rem' }}
          onClick={() => navigate('/login')}
        >
          <Stethoscope size={20} />
          Sou Profissional de Saúde
        </button>
        <button
          className="btn btn-secondary w-full"
          style={{ padding: '1rem 1.25rem', fontSize: '1.05rem' }}
          onClick={() => navigate('/parent')}
        >
          <Heart size={20} />
          Sou Responsável
        </button>
      </div>

      {/* Feature row */}
      <div
        className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 w-full"
        style={{ maxWidth: 760 }}
      >
        <FeatureBadge icon={<LineChart size={22} />} label="Gráficos automáticos" />
        <FeatureBadge icon={<Users size={22} />} label="Acompanhamento evolutivo" />
        <FeatureBadge icon={<Target size={22} />} label="Percentis e escore-Z" />
        <FeatureBadge icon={<FileText size={22} />} label="Relatórios profissionais" />
      </div>
    </div>
  );
};

const FeatureBadge: React.FC<{ icon: React.ReactNode; label: string }> = ({
  icon,
  label,
}) => (
  <div className="flex flex-col items-center text-center gap-2">
    <div
      className="flex items-center justify-center"
      style={{
        width: 52,
        height: 52,
        borderRadius: 14,
        background: 'rgba(34, 182, 168, 0.12)',
        color: 'var(--color-primary)',
      }}
    >
      {icon}
    </div>
    <span className="text-xs font-medium text-dark">{label}</span>
  </div>
);

export default Home;
