import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const ICONS = { success: CheckCircle, error: AlertCircle, info: Info };

const COLORS = {
  success: { bg: '#f0fdf4', border: '#86efac', color: '#15803d', icon: '#22c55e' },
  error:   { bg: '#fef2f2', border: '#fca5a5', color: '#dc2626', icon: '#ef4444' },
  info:    { bg: 'var(--color-white)', border: 'var(--color-border)', color: 'var(--color-dark)', icon: 'var(--color-primary)' },
};

function ToastEntry({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    timerRef.current = setTimeout(onClose, 3200);
    return () => clearTimeout(timerRef.current);
  }, [onClose]);

  const Icon = ICONS[toast.type];
  const c = COLORS[toast.type];

  return (
    <div
      className="toast-item"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}
      role="alert"
      aria-live="polite"
    >
      <Icon size={18} style={{ color: c.icon, flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: '0.875rem', lineHeight: 1.4 }}>{toast.message}</span>
      <button
        onClick={onClose}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.color, padding: '0.1rem', lineHeight: 1, flexShrink: 0 }}
        aria-label="Fechar notificação"
      >
        <X size={15} />
      </button>
    </div>
  );
}

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          maxWidth: '22rem',
          width: 'calc(100vw - 2rem)',
          pointerEvents: 'none',
        }}
        aria-label="Notificações"
      >
        {toasts.map(toast => (
          <div key={toast.id} style={{ pointerEvents: 'auto' }}>
            <ToastEntry toast={toast} onClose={() => removeToast(toast.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};
