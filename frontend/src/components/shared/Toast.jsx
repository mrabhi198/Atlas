import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info
};

const ICON_COLORS = {
  success: 'var(--neon-green)',
  error: 'var(--neon-red)',
  warning: 'var(--neon-yellow)',
  info: 'var(--neon-cyan)'
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const push = useCallback((message, opts = {}) => {
    const id = ++idRef.current;
    const { variant = 'info', duration = 4000 } = opts;
    setToasts(prev => [...prev, { id, message, variant }]);
    if (duration) {
      setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  const api = {
    success: (message, opts) => push(message, { ...opts, variant: 'success' }),
    error: (message, opts) => push(message, { ...opts, variant: 'error' }),
    warning: (message, opts) => push(message, { ...opts, variant: 'warning' }),
    info: (message, opts) => push(message, { ...opts, variant: 'info' }),
    dismiss,
    push
  };

  return (
    <ToastContext.Provider value={api}>
      {children}

      <div className="atlas-toast-viewport" aria-label="Notifications">
        {toasts.map(t => {
          const Icon = ICONS[t.variant] || Info;
          return (
            <div key={t.id} className={`atlas-toast atlas-toast--${t.variant}`} role="status">
              <Icon size={16} style={{ color: ICON_COLORS[t.variant] }} aria-hidden="true" />
              <span className="atlas-toast__content">{t.message}</span>
              <button type="button" className="atlas-toast__close" onClick={() => dismiss(t.id)} aria-label="Dismiss notification">
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}