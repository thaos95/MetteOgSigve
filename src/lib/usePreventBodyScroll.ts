import { useEffect } from 'react';

export default function usePreventBodyScroll(locked: boolean) {
  useEffect(() => {
    const prev = document.body.style.overflow || '';
    if (locked) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}
