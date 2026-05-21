import React from 'react';

interface LogoProps {
  size?: number;
  withWordmark?: boolean;
  tagline?: boolean;
  variant?: 'default' | 'mono';
}

/**
 * PedCurve brand logo.
 * Inspired by the brand sheet: a stylised "P" whose tail morphs into a
 * rising growth-curve line with a coral data point at its tip.
 */
const Logo: React.FC<LogoProps> = ({
  size = 40,
  withWordmark = false,
  tagline = false,
  variant = 'default',
}) => {
  const dark = variant === 'mono' ? '#FFFFFF' : '#0D2B45';
  const mint = variant === 'mono' ? '#FFFFFF' : '#22B6A8';
  const coral = variant === 'mono' ? '#FFFFFF' : '#FF8B8B';

  return (
    <div className="brand" style={{ gap: withWordmark ? '0.6rem' : 0 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="PedCurve logo"
      >
        {/* Stem of the P */}
        <rect x="10" y="8" width="7" height="48" rx="3.5" fill={dark} />
        {/* Bowl of the P */}
        <path
          d="M17 12 H32 a14 14 0 0 1 0 28 H17 Z"
          fill="none"
          stroke={dark}
          strokeWidth="7"
          strokeLinejoin="round"
        />
        {/* Rising growth curve coming out of the P tail */}
        <path
          d="M17 50 Q 28 50, 34 42 Q 42 32, 52 22"
          fill="none"
          stroke={mint}
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        {/* Data point */}
        <circle cx="52" cy="22" r="4.5" fill={coral} />
      </svg>

      {withWordmark && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
          <span className="brand-text">
            Ped<span className="accent">Curve</span>
          </span>
          {tagline && (
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
              Curvas inteligentes para a saúde infantil
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
