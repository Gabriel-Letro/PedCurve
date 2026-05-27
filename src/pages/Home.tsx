import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Baby, Heart, Brain, AlertTriangle,
  ArrowRight, Stethoscope, Shield, FileText
} from 'lucide-react';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';

const CURVE_HIGHLIGHTS = [
  { icon: <Baby size={18} />,          label: 'OMS 0–19 anos',        sub: 'Score Z',   color: '#0B7A6E' },
  { icon: <Heart size={18} />,         label: 'Síndrome de Down',     sub: 'Percentil', color: '#7C3AED' },
  { icon: <Brain size={18} />,         label: 'Prematuros',           sub: 'Fenton / Intergrowth', color: '#0EA5E9' },
  { icon: <AlertTriangle size={18} />, label: 'Turner / Williams',    sub: 'Percentil', color: '#B45309' },
];

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="auth-page">
    <div className="home-page">
      {/* Top-right theme toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
        <ThemeToggle className="theme-toggle-light" />
      </div>

      {/* Hero */}
      <div className="home-hero">
        <Logo size={64} withWordmark tagline />

        <h2 className="home-headline">
          Curvas de crescimento com{' '}
          <span className="text-primary">precisão clínica</span>
        </h2>
        <p className="home-sub">
          Plataforma para profissionais de saúde gerarem curvas de crescimento
          individualizadas conforme o perfil clínico do paciente, com
          Score&nbsp;Z ou Percentil na referência correta.
        </p>

        {/* CTAs */}
        <div className="home-cta-row">
          <button
            className="btn btn-primary home-cta-primary"
            onClick={() => navigate('/login')}
          >
            <Stethoscope size={20} />
            Acesso Profissional
            <ArrowRight size={16} />
          </button>
          <button
            className="btn btn-primary home-cta-primary home-cta-parent"
            onClick={() => navigate('/parent')}
          >
            <Shield size={20} />
            Acesso do Responsável
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Curve type chips — decorative preview */}
        <div className="home-type-chips">
          {CURVE_HIGHLIGHTS.map((t) => (
            <div
              key={t.label}
              className="home-type-chip"
              style={{ '--chip-color': t.color } as React.CSSProperties}
            >
              <span style={{ color: t.color }}>{t.icon}</span>
              <span className="chip-label">{t.label}</span>
              <span className="chip-sub">{t.sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Feature strip */}
      <div className="home-features">
        <Feature icon={<TrendingUp size={20} />} label="Score Z e Percentil" desc="Cálculo automático conforme a curva selecionada" />
        <Feature icon={<FileText size={20} />} label="Interpretação clínica" desc="Resultado com alerta visual e texto interpretativo" />
        <Feature icon={<Shield size={20} />} label="Curvas validadas" desc="OMS, Fenton, Mustacchi, Turner, Williams-Beuren" />
        <Feature icon={<Baby size={20} />} label="Populações especiais" desc="Prematuros, síndromes e acondroplasia" />
      </div>
    </div>
    </div>
  );
};

const Feature: React.FC<{ icon: React.ReactNode; label: string; desc: string }> = ({ icon, label, desc }) => (
  <div className="home-feature">
    <div className="home-feature-icon">{icon}</div>
    <div>
      <div className="home-feature-label">{label}</div>
      <div className="home-feature-desc">{desc}</div>
    </div>
  </div>
);

export default Home;
