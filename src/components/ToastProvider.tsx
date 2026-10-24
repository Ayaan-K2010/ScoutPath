import { Check } from './icons';
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { ToastContext } from '../lib/toastContext';

interface Toast {
  id: number;
  message: string;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);
  const show = useCallback((message: string) => {
    const id = ++counter.current;
    setToasts((list) => [...list.slice(-2), { id, message }]);
    window.setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 2600);
  }, []);
  const api = useMemo(() => ({ show }), [show]);
  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-region" role="status" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <div className="toast" key={t.id}>
            <Check size={16} aria-hidden="true" />
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
