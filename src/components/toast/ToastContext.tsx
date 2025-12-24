import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import ToastContainer from './ToastContainer';

export type ToastOptions = { message: string; duration?: number; variant?: 'success'|'error'|'info'; key?: string; dedupe?: boolean; action?: { label: string; onClick?: () => void } };
export type Toast = ToastOptions & { id: string };

const MAX_TOASTS = 4;

const ToastContext = createContext({ addToast: (_: ToastOptions) => '', removeToast: (id: string) => {} } as { addToast: (t: ToastOptions) => string; removeToast: (id: string) => void });

export function ToastProvider({ children, maxToasts = 4 }: { children: React.ReactNode; maxToasts?: number }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idCounter = useRef(0);

  const addToast = useCallback((opts: ToastOptions) => {
    let returnedId = '';
    setToasts(prev => {
      // dedupe: if requested, find existing by key or by message+variant
      if (opts.dedupe) {
        const match = prev.find(t => (opts.key && t.key === opts.key) || (!opts.key && t.message === opts.message && t.variant === opts.variant));
        if (match) {
          // move match to end (refresh) and update it
          const others = prev.filter(t => t.id !== match.id);
          returnedId = match.id;
          return [...others, { ...match, ...opts } as Toast];
        }
      }

      const id = `toast-${++idCounter.current}-${Date.now()}`;
      returnedId = id;
      const next = [...prev, { ...opts, id } as Toast];
      // enforce max stacking limit
      if (next.length > maxToasts) {
        // drop oldest
        return next.slice(next.length - maxToasts);
      }
      return next;
    });
    return returnedId;
  }, [maxToasts]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() { return useContext(ToastContext); }
