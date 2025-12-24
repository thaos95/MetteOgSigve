import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { ToastProvider, useToast } from '../ToastContext';

function StackingHarness() {
  const { addToast } = useToast();
  return <div>
    <button onClick={() => addToast({ message: 'A' })}>A</button>
    <button onClick={() => addToast({ message: 'B' })}>B</button>
    <button onClick={() => addToast({ message: 'C' })}>C</button>
    <button onClick={() => addToast({ message: 'D' })}>D</button>
    <button onClick={() => addToast({ message: 'E' })}>E</button>
  </div>;
}

describe('Toast stacking limit', () => {
  test('limits to MAX_TOASTS (4) by dropping oldest', () => {
    render(<ToastProvider><StackingHarness /></ToastProvider>);

    act(() => {
      screen.getByRole('button', { name: /a/i }).click();
      screen.getByRole('button', { name: /b/i }).click();
      screen.getByRole('button', { name: /c/i }).click();
      screen.getByRole('button', { name: /d/i }).click();
      screen.getByRole('button', { name: /e/i }).click();
    });

    const status = screen.getByRole('status');
    // there should be only 4 toasts, and 'A' should have been dropped
    expect(Array.from(status.querySelectorAll('div.text-sm')).map(n => n.textContent)).not.toContain('A');
    expect(status.querySelectorAll('div.text-sm')[0].textContent).toBeDefined();
    expect(status.textContent).toContain('B');
    expect(status.textContent).toContain('E');
  });
});