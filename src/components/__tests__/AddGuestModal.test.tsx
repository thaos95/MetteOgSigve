import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddGuestModal from '../AddGuestModal';

describe('AddGuestModal', () => {
  test('renders and validates input', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(<AddGuestModal open={true} onClose={onClose} onSave={onSave} />);

    // Title
    expect(screen.getByRole('heading', { name: /add guest/i })).toBeVisible();

    // Save with empty inputs shows validation
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(await screen.findByText(/first name is required/i)).toBeVisible();

    // Fill inputs and save
    await waitFor(() => expect(screen.getByLabelText(/first name/i)).toHaveFocus());
    // use fireEvent to synchronously set values
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Alice' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Smith' } });
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(onSave).toHaveBeenCalledWith({ firstName: 'Alice', lastName: 'Smith', attending: true });
    // modal should be closed (onClose called)
    expect(onClose).toHaveBeenCalled();
  });
});
