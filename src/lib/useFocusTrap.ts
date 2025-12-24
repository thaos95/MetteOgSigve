import { useEffect } from 'react';

function getFocusableElements(el: HTMLElement) {
  return Array.from(el.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea, input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )).filter(e => !e.hasAttribute('disabled') && e.getAttribute('aria-hidden') !== 'true');
}

export default function useFocusTrap(rootRef: React.RefObject<HTMLElement | null>, options?: { initialFocusRef?: React.RefObject<HTMLElement | null>, onClose?: () => void }) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const focusables = getFocusableElements(root);
    const first = options?.initialFocusRef?.current ?? focusables[0] ?? null;
    const last = focusables[focusables.length - 1] ?? null;

    // focus initial element
    if (first) {
      try { first.focus(); } catch (e) { /* ignore */ }
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        options?.onClose?.();
        return;
      }
      if (e.key !== 'Tab') return;
      const current = document.activeElement as HTMLElement | null;
      const focusList = getFocusableElements(root);
      if (!focusList.length) return;
      const firstFocusable = focusList[0];
      const lastFocusable = focusList[focusList.length - 1];

      // Find index of current in focusList
      const idx = focusList.indexOf(current as HTMLElement);
      if (e.shiftKey) {
        e.preventDefault();
        if (idx <= 0) {
          lastFocusable.focus();
        } else {
          focusList[idx - 1].focus();
        }
      } else {
        e.preventDefault();
        if (idx === -1 || idx === focusList.length - 1) {
          firstFocusable.focus();
        } else {
          focusList[idx + 1].focus();
        }
      }
    }

    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
    };
  }, [rootRef, options?.initialFocusRef, options?.onClose]);
}
