import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { ToastProvider, useToast } from '../ToastContext';

function DedupeHarness() {
  const { addToast } = useToast();
  return <div>
    <button onClick={() => addToast({ message: 'X', dedupe: true })}>X</button>
    <button onClick={() => addToast({ message: 'X', dedupe: true })}>X2</button>
  </div>;
}

describe('Toast dedupe', () => {
  test('adds only one toast when dedupe true', () => {
    render(<ToastProvider><DedupeHarness /></ToastProvider>);

    act(() => { screen.getByRole('button', { name: /^X$/i }).click(); });
    const status = screen.getByRole('status');
    expect(status.querySelectorAll('div.text-sm').length).toBeGreaterThanOrEqual(1);
    expect(status.querySelectorAll('div.text-sm')[0].textContent).toBe('X');

    act(() => { screen.getByRole('button', { name: /x2/i }).click(); });
    // still only one toast with message X inside status
    const matches = Array.from(status.querySelectorAll('div.text-sm')).filter(n => n.textContent === 'X');
    expect(matches.length).toBe(1);
  });
});