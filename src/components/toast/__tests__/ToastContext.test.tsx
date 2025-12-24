import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { act } from 'react-dom/test-utils';
import { ToastProvider, useToast } from '../ToastContext';

function TestHarness() {
  const { addToast } = useToast();
  return <button onClick={() => addToast({ message: 'Hello world', duration: 500 })}>Add</button>;
}

describe('ToastContext', () => {
  test('adds and auto-dismisses toasts', async () => {
    render(
      <ToastProvider>
        <TestHarness />
      </ToastProvider>
    );

    // Add toast
    act(() => { fireEvent.click(screen.getByRole('button', { name: /add/i })); });

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/Hello world/));

    // wait for toast to auto-dismiss using real timers (allow animation time)
    await waitFor(() => expect(screen.queryByRole('status')).toBeNull(), { timeout: 3000 });
  });
});
