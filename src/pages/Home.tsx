import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Star } from 'lucide-react';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';

const HeroCurve = () => (
  <svg className="hero-curve" viewBox="0 0 420 300" fill="none" aria-hidden="true">
    <g stroke="var(--color-border)" strokeWidth="1">
      <line x1="30" y1="40" x2="30" y2="260" />
      <line x1="30" y1="260" x2="400" y2="260" />
    </g>
    <path d="M30 240 C 110 230, 170 185, 230 155 S 350 95, 400 75" stroke="var(--color-primary)" strokeWidth="1.4" opacity=".4" strokeDasharray="5 4" />
    <path d="M30 250 C 120 240, 180 205, 240 178 S 360 122, 400 105" stroke="var(--color-primary)" strokeWidth="1.8" opacity=".7" />
    <path d="M30 256 C 128 248, 190 220, 250 196 S 365 148, 400 132" stroke="var(--color-primary)" strokeWidth="1.4" opacity=".4" strokeDasharray="5 4" />
    <path d="M40 252 C 110 240, 165 208, 220 182 S 330 130, 385 108" stroke="#D96A4F" strokeWidth="3" strokeLinecap="round" />
    <circle cx="95" cy="237" r="5" fill="var(--color-white)" stroke="#D96A4F" strokeWidth="2.4" />
    <circle cx="220" cy="182" r="5" fill="var(--color-white)" stroke="#D96A4F" strokeWidth="2.4" />
    <circle cx="320" cy="135" r="5" fill="var(--color-white)" stroke="#D96A4F" strokeWidth="2.4" />
    <circle cx="385" cy="108" r="6" fill="#D96A4F" />
    <text x="345" y="92" fontFamily="Karla" fontSize="11" fontWeight="700" fill="#D96A4F">P47</text>
  </svg>
);

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="home-screen">
      <header className="home-head">
        <Logo size={38} withWordmark />
        <div className="home-head-actions">
          <ThemeToggle className="theme-toggle-light" />
          <button className="home-head-enter" onClick={() => navigate('/login')}>
            Entrar <ArrowRight size={15} />
          </button>
        </div>
      </header>

      <div className="home-hero">
        <span className="hero-kicker">Curvas oficiais OMS · CDC</span>
        <h1>
          Toda curva conta a <em>história</em> de um crescimento.
        </h1>
        <p>
          Registre consultas, calcule percentis e Escore-Z automaticamente e
          compartilhe a evolução da criança com a família — com um simples
          código de acesso.
        </p>
        <HeroCurve />
      </div>

      <div className="home-portais">
        <button className="portal portal-pro" onClick={() => navigate('/login')}>
          <span className="picto">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 3v6a5 5 0 0 0 10 0V3" />
              <path d="M10 14v2a4 4 0 0 0 8 0v-1" />
              <circle cx="18" cy="12" r="2.4" />
            </svg>
          </span>
          <h3>Sou profissional de saúde</h3>
          <p>
            Cadastre pacientes, registre peso, estatura e perímetro cefálico, e
            acompanhe percentis e Escore-Z calculados na hora.
          </p>
          <span className="go">
            Acessar meu consultório <ArrowRight size={16} />
          </span>
        </button>

        <button className="portal portal-pais" onClick={() => navigate('/parent')}>
          <span className="picto">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 21s-7-4.6-9.5-9A5.4 5.4 0 0 1 12 6.6 5.4 5.4 0 0 1 21.5 12C19 16.4 12 21 12 21z" />
            </svg>
          </span>
          <h3>Sou pai, mãe ou responsável</h3>
          <p>
            Digite o código que recebeu na consulta — tipo{' '}
            <span className="portal-code">HELENA1</span> — e veja o crescimento
            do seu filho. Sem cadastro, sem senha.
          </p>
          <span className="go">
            Ver o crescimento do meu filho <ArrowRight size={16} />
          </span>
        </button>
      </div>

      <footer className="home-foot">
        <span className="ref">
          <Check size={16} /> Padrões de crescimento <b>OMS 2006/2007</b>
        </span>
        <span className="ref">
          <Check size={16} /> Referências <b>CDC 2000</b>
        </span>
        <span className="ref">
          <Star size={15} /> Dados ficam no seu dispositivo
        </span>
      </footer>
    </div>
  );
};

export default Home;
