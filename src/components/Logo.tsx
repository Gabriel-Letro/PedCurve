import React from 'react';

interface LogoProps {
  size?: number;
  withWordmark?: boolean;
  tagline?: boolean;
  variant?: 'default' | 'mono';
}

/**
 * PedCurve brand logo — selo arredondado verde-pinho com uma curva de
 * crescimento ascendente e pontos de medição (protótipo v1.0).
 */
const Logo: React.FC<LogoProps> = ({
  size = 40,
  withWordmark = false,
  tagline = false,
  variant = 'default',
}) => {
  const mono = variant === 'mono';
  const sealBg = mono ? 'rgba(246,242,232,0.12)' : 'var(--color-primary, #14524A)';
  const stroke = '#F6F2E8';

  return (
    <div className="brand" style={{ gap: withWordmark ? '0.6rem' : 0 }}>
      <span
        className={`brand-mark${mono ? ' on-dark' : ''}`}
        style={{ width: size, height: size, background: sealBg, borderRadius: size * 0.29 }}
      >
        <svg
          width={size * 0.58}
          height={size * 0.58}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="PedCurve logo"
        >
          <path
            d="M4 19 C 8 18, 11 14, 14 11 S 19 6, 21 5"
            stroke={stroke}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx="8" cy="16.5" r="1.4" fill={stroke} />
          <circle cx="15" cy="10" r="1.4" fill={stroke} />
        </svg>
      </span>

      {withWordmark && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
          <span className="brand-text" style={mono ? { color: '#F6F2E8' } : undefined}>
            Ped<span className="accent">Curve</span>
          </span>
          {tagline && (
            <span
              style={{
                fontSize: '0.7rem',
                color: mono ? 'rgba(246,242,232,0.6)' : 'var(--color-text-muted)',
              }}
            >
              Toda curva conta uma história
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
