import React, { useEffect, useState } from 'react';

const ANIM_MS = 200;

function Icon({ variant }: { variant?: string }) {
  if (variant === 'success') return (<svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>);
  if (variant === 'error') return (<svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>);
  return (<svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/></svg>);
}

export default function ToastContainer({ toasts, removeToast }: { toasts: Array<{ id: string; message: string; duration?: number; variant?: string; action?: { label: string; onClick?: () => void } }>; removeToast: (id: string) => void }) {
  // local items track visibility for enter/exit animations
  const [items, setItems] = useState(() => toasts.map(t => ({ t, visible: true })));

  useEffect(() => {
    // Sync items to the provider's toasts while preserving existing visibility state
    setItems(prev => toasts.map(t => prev.find(x => x.t.id === t.id) ?? { t, visible: true }));
  }, [toasts]);

  const timersRef = React.useRef<Map<string, { hide?: any; remove?: any }>>(new Map());

  useEffect(() => {
    items.forEach(it => {
      const id = it.t.id;
      if (timersRef.current.has(id)) return; // timers already scheduled
      const dur = it.t.duration ?? 3000;
      const hide = setTimeout(() => {
        setItems(prev => prev.map(p => p.t.id === id ? { ...p, visible: false } : p));
      }, dur);
      const remove = setTimeout(() => {
        try { removeToast(id); } finally { timersRef.current.delete(id); }
      }, dur + ANIM_MS);
      timersRef.current.set(id, { hide, remove });
    });

    return () => {
      // no-op: we keep timersRef across renders; individual timers will be cleared when toasts are removed
    };
  }, [items, removeToast]);

  // Cleanup timers when provider toasts no longer include an id (ensures no leaked timers)
  useEffect(() => {
    const activeIds = new Set(toasts.map(t => t.id));
    for (const [id, timers] of Array.from(timersRef.current.entries())) {
      if (!activeIds.has(id)) {
        if (timers.hide) clearTimeout(timers.hide);
        if (timers.remove) clearTimeout(timers.remove);
        timersRef.current.delete(id);
      }
    }
  }, [toasts]);

  if (!items.length) return null;

  const getVariantClasses = (variant?: string) => {
    if (variant === 'success') return 'bg-emerald-600';
    if (variant === 'error') return 'bg-red-600';
    return 'bg-gray-900';
  };

  const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const transitionClass = prefersReduced ? '' : 'transition-transform transition-opacity duration-200 ease-out';

  return (
    <div aria-live="polite" role="status" className="fixed top-4 right-4 z-50 space-y-2">
      {items.map(({ t, visible }) => (
        <div key={t.id} data-toast-id={t.id} className={`${getVariantClasses(t.variant)} text-white px-4 py-2 rounded shadow ${transitionClass} ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Icon variant={t.variant} />
              <div className="text-sm">{t.message}</div>
            </div>
            <div className="flex items-center gap-2">
              {t.action && (
                <button onClick={() => {
                  try { t.action?.onClick?.(); } catch (e) { /* ignore */ }
                  // remove after action
                  setItems(prev => prev.map(p => p.t.id === t.id ? { ...p, visible: false } : p));
                  setTimeout(() => removeToast(t.id), ANIM_MS);
                }} className="px-2 py-1 bg-white text-gray-900 rounded text-xs" aria-label={t.action.label}>{t.action.label}</button>
              )}
              <button aria-label="Close" onClick={() => {
                // start hide animation then call remove
                setItems(prev => prev.map(p => p.t.id === t.id ? { ...p, visible: false } : p));
                setTimeout(() => removeToast(t.id), ANIM_MS);
              }} className="text-xs opacity-90">×</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
