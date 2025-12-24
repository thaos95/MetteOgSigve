"use client";
import React, { useEffect, useRef, useState } from 'react';
import useFocusTrap from '../lib/useFocusTrap';
import usePreventBodyScroll from '../lib/usePreventBodyScroll';

export default function AddGuestModal({
  open,
  onClose,
  onSave,
  initialFirst = '',
  initialLast = '',
}: {
  open: boolean;
  onClose: () => void;
  onSave: (payload: { firstName: string; lastName: string; attending: boolean }) => Promise<void>;
  initialFirst?: string;
  initialLast?: string;
}) {
  const [firstName, setFirstName] = useState(initialFirst);
  const [lastName, setLastName] = useState(initialLast);
  const [attending, setAttending] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const firstRef = useRef<HTMLInputElement | null>(null);

  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const lastActiveRef = React.useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      // remember opener to restore focus later
      try { lastActiveRef.current = document.activeElement as HTMLElement | null; } catch (e) { lastActiveRef.current = null; }
      setFirstName(initialFirst);
      setLastName(initialLast);
      setAttending(true);
      setError(null);
      setSaving(false);
      // small timeout to ensure element is in DOM
      setTimeout(() => firstRef.current?.focus(), 10);
    }
  }, [open, initialFirst, initialLast]);

  // restore focus to last active when modal closes
  function restoreFocus() {
    try {
      // attempt to restore focus in next animation frame and again to be robust across browsers
      requestAnimationFrame(() => {
        try { lastActiveRef.current?.focus(); } catch (e) { /* ignore */ }
        setTimeout(() => { try { lastActiveRef.current?.focus(); } catch (e) { /* ignore */ } }, 0);
      });
    } catch (e) { /* ignore */ }
  }

  function validate() {
    const fn = (firstName || '').trim();
    const ln = (lastName || '').trim();
    if (!fn) return 'First name is required';
    if (!ln) return 'Last name is required';
    if (fn.length > 64) return 'First name too long';
    if (ln.length > 64) return 'Last name too long';
    return null;
  }

  async function handleSave() {
    const v = validate();
    if (v) { setError(v); return; }
    setError(null);
    setSaving(true);
    try {
      await onSave({ firstName: firstName.trim(), lastName: lastName.trim(), attending: !!attending });
      onClose();
      restoreFocus();
    } catch (e: any) {
      setError(e?.message ?? 'Save failed');
    } finally { setSaving(false); }
  }

  // hooks for focus trap + prevent body scroll — call them unconditionally to keep hooks order stable
  usePreventBodyScroll(open);
  useFocusTrap(rootRef, { initialFocusRef: firstRef, onClose: () => { onClose(); restoreFocus(); } });

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="add-guest-title" ref={rootRef} className="fixed inset-0 z-50 flex items-center justify-center p-4" data-open>
      <div className="absolute inset-0 bg-black opacity-40" onClick={() => { onClose(); restoreFocus(); }} />
      <div className="relative bg-white rounded shadow max-w-md w-full p-4 transition-transform transform scale-100" data-open>
        <h3 id="add-guest-title" className="text-lg font-medium">Add guest</h3>
        <div className="mt-3 space-y-3">
          <div>
            <label htmlFor="first-name" className="block text-sm">First name</label>
            <input id="first-name" ref={firstRef} value={firstName} onChange={e => setFirstName(e.target.value)} className="mt-1 w-full p-2 border rounded" aria-invalid={!!error && !firstName.trim()} />
          </div>
          <div>
            <label htmlFor="last-name" className="block text-sm">Last name</label>
            <input id="last-name" value={lastName} onChange={e => setLastName(e.target.value)} className="mt-1 w-full p-2 border rounded" aria-invalid={!!error && !lastName.trim()} />
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={attending} onChange={e => setAttending(e.target.checked)} />
              <span className="text-sm">Attending</span>
            </label>
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => { onClose(); restoreFocus(); }} className="px-3 py-1 bg-gray-200 rounded">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-3 py-1 bg-blue-600 text-white rounded">{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}
