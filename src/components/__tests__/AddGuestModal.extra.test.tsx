import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import user from '@testing-library/user-event';
import { vi } from 'vitest';
import AddGuestModal from '../AddGuestModal';

describe('AddGuestModal - extra', () => {
  test('renders initial values and focuses first input', async () => {
    const onClose = vi.fn();
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(<AddGuestModal open={true} onClose={onClose} onSave={onSave} initialFirst="John" initialLast="Doe" />);

    expect(screen.getByLabelText(/first name/i)).toHaveValue('John');
    expect(screen.getByLabelText(/last name/i)).toHaveValue('Doe');
  });

  test('shows validation when name too long', async () => {
    const onClose = vi.fn();
    const onSave = vi.fn();
    const long = 'a'.repeat(65);
    render(<AddGuestModal open={true} onClose={onClose} onSave={onSave} />);

    await user.type(screen.getByLabelText(/first name/i), long);
    await user.type(screen.getByLabelText(/last name/i), 'Smith');
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(await screen.findByText(/First name too long/i)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  test('displays save error when onSave rejects', async () => {
    const onClose = vi.fn();
    const onSave = vi.fn().mockRejectedValue(new Error('save failed'));

    render(<AddGuestModal open={true} onClose={onClose} onSave={onSave} />);

    await user.type(screen.getByLabelText(/first name/i), 'Alice');
    await user.type(screen.getByLabelText(/last name/i), 'Smith');
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(await screen.findByText(/save failed/i)).toBeInTheDocument();
    // ensure modal not closed
    expect(onClose).not.toHaveBeenCalled();
  });

  test('closes on Escape and restores focus to opener', async () => {
    function Wrapper() {
      const [open, setOpen] = React.useState(false);
      return (
        <div>
          <button onClick={() => setOpen(true)}>Open</button>
          <AddGuestModal open={open} onClose={() => setOpen(false)} onSave={async () => {}} />
        </div>
      );
    }

    render(<Wrapper />);

    const openBtn = screen.getByRole('button', { name: /open/i });
    openBtn.focus();
    await user.click(openBtn);

    // modal open and first name focused
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    expect(screen.getByLabelText(/first name/i)).toHaveFocus();

    // press Escape
    await user.keyboard('{Escape}');

    // modal closed and opener focused
    await waitFor(() => expect(openBtn).toHaveFocus());
  });

  test('traps focus with Tab/Shift+Tab', async () => {
    render(<AddGuestModal open={true} onClose={() => {}} onSave={async () => {}} />);

    const first = screen.getByLabelText(/first name/i);
    const last = screen.getByLabelText(/last name/i);
    const checkbox = screen.getByRole('checkbox');
    const cancel = screen.getByRole('button', { name: /cancel/i });
    const save = screen.getByRole('button', { name: /save/i });

    // initial focus should be first
    expect(first).toHaveFocus();

    // tab to last
    await user.tab();
    expect(last).toHaveFocus();

    // tab to checkbox
    await user.tab();
    expect(checkbox).toHaveFocus();

    // tab to cancel
    await user.tab();
    expect(cancel).toHaveFocus();

    // tab to save
    await user.tab();
    expect(save).toHaveFocus();

    // tab again should cycle to first
    await user.tab();
    expect(first).toHaveFocus();

    // shift+tab from first should go to save
    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(save).toHaveFocus();
  });

  test('passes attending flag to onSave', async () => {
    const onClose = vi.fn();
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(<AddGuestModal open={true} onClose={onClose} onSave={onSave} />);

    // ensure initial focus has settled
    await waitFor(() => expect(screen.getByLabelText(/first name/i)).toHaveFocus());

    // Uncheck attending
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();

    const firstInput = screen.getByLabelText(/first name/i);
    const lastInput = screen.getByLabelText(/last name/i);

    // ensure focus is on first input before typing to avoid timing races
    await user.click(firstInput);
    // use fireEvent to synchronously set values to avoid intermittent typing races
    fireEvent.change(firstInput, { target: { value: 'Bob' } });
    fireEvent.change(lastInput, { target: { value: 'Builder' } });
    await user.click(screen.getByRole('button', { name: /save/i }));

    // onSave should have been called with attending false
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ firstName: 'Bob', lastName: 'Builder', attending: false }));
    expect(onClose).toHaveBeenCalled();
  });
});
