'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h2 className="font-serif text-3xl text-primary mb-4">Noe gikk galt</h2>
      <p className="text-warm-gray mb-8">Beklager, det oppstod en feil. Vennligst prøv igjen.</p>
      <button
        onClick={() => reset()}
        className="btn-primary"
      >
        Prøv igjen
      </button>
    </div>
  );
}
