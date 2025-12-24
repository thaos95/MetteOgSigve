// DEPRECATED - single Toast component. Prefer `useToast` and `ToastProvider`.
import React from 'react';

export default function Toast({ message, duration = 3000, onClose }: { message: string; duration?: number; onClose?: () => void }) {
  if (!message) return null;
  return (
    <div aria-live="polite" role="status" className="fixed top-4 right-4 z-50">
      <div className="bg-gray-900 text-white px-4 py-2 rounded shadow">{message}
        <button aria-label="Close" onClick={() => onClose?.()} className="ml-3 text-xs opacity-90">×</button>
      </div>
    </div>
  );
}
