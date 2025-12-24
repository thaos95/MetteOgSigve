import React from 'react';
import { render, screen } from '@testing-library/react';
import { ToastProvider, useToast } from '../ToastContext';

function VariantHarness() {
  const { addToast } = useToast();
  return <div>
    <button onClick={() => addToast({ message: 'ok', variant: 'success' })}>Success</button>
    <button onClick={() => addToast({ message: 'err', variant: 'error' })}>Error</button>
  </div>;
}

describe('Toast variants', () => {
  test('renders success and error variant classes', async () => {
    render(<ToastProvider><VariantHarness /></ToastProvider>);

    (await screen.findByRole('button', { name: /success/i })).click();
    expect(await screen.findByText('ok')).toBeInTheDocument();
    const successToast = screen.getByText('ok').closest('[data-toast-id]');
    expect(successToast).toHaveClass('bg-emerald-600');

    (await screen.findByRole('button', { name: /error/i })).click();
    expect(await screen.findByText('err')).toBeInTheDocument();
    const errorToast = screen.getByText('err').closest('[data-toast-id]');
    expect(errorToast).toHaveClass('bg-red-600');
  });
});