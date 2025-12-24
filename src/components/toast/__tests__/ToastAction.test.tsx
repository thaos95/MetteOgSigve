import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToastProvider, useToast } from '../ToastContext';

function ActionHarness() {
  const { addToast } = useToast();
  return <button onClick={() => addToast({ message: 'Undoable', action: { label: 'Undo', onClick: () => window['__UNDO_CALLED__'] = true } })}>Add</button>;
}

describe('Toast action button', () => {
  test('renders action button and triggers callback', () => {
    delete (window as any)['__UNDO_CALLED__'];
    render(<ToastProvider><ActionHarness /></ToastProvider>);

    fireEvent.click(screen.getByRole('button', { name: /add/i }));
    const actionBtn = screen.getByRole('button', { name: /undo/i, hidden: false });
    expect(actionBtn).toBeInTheDocument();
    fireEvent.click(actionBtn);
    expect((window as any)['__UNDO_CALLED__']).toBeTruthy();

    // after clicking action, the toast should start to dismiss (visible becomes false quickly)
    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();

  });
});