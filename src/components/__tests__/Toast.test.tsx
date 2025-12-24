import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import Toast from '../Toast';

describe('Toast', () => {
  test('renders message and close button works', () => {
    const onClose = vi.fn();
    render(<Toast message="Hello" onClose={onClose} />);

    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: /close/i });
    fireEvent.click(btn);
    expect(onClose).toHaveBeenCalled();
  });
});
