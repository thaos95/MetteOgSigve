import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import user from '@testing-library/user-event';
import { vi } from 'vitest';
import AdminPage from '../page';

const initialRsvp = { id: 1, name: 'Test Guest', email: 'test@example.com', attending: true, first_name: 'Test', last_name: 'Guest', notes: '', party: [] };
const updatedRsvp = { ...initialRsvp, party: [{ firstName: 'New', lastName: 'Guest', attending: true }] };

describe('AdminPage Add guest flow', () => {
  let fetchMock: any;

  beforeEach(() => {
    fetchMock = vi.fn(async (url: string, opts?: any) => {
      if (url.endsWith('/api/admin/rsvps') && opts?.method === 'POST') {
        return { ok: true, json: async () => ({ rsvps: [initialRsvp] }) };
      }
      if (url.endsWith('/api/admin/edit-guest') && opts?.method === 'POST') {
        return { ok: true, json: async () => ({ rsvp: updatedRsvp }) };
      }
      return { ok: true, json: async () => ({}) };
    });
    (globalThis as any).fetch = fetchMock;
  });

  afterEach(() => vi.restoreAllMocks());

  test('login, open Add Guest modal, add guest and update rsvp list', async () => {
    render(<AdminPage />);

    // login with password
    await user.type(screen.getByPlaceholderText(/Admin password/i), 'pw');
    await user.click(screen.getByRole('button', { name: /login/i }));

    // wait for login to complete and rsvp to be shown
    await waitFor(() => {
      const els = screen.getAllByText(/Test Guest/);
      expect(els.length).toBeGreaterThan(0);
    });

    // Click Add guest for the rsvp
    await user.click(screen.getByRole('button', { name: /add guest$/i }));

    // Modal should appear (dialog role)
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

    // Fill modal and save
    await user.type(screen.getByLabelText(/first name/i), 'New');
    await user.type(screen.getByLabelText(/last name/i), 'Guest');
    await user.click(screen.getByRole('button', { name: /save/i }));

    // The admin edit-guest endpoint should have been called
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/admin/edit-guest', expect.anything()));

    // After saving, the party size indicator should reflect new guest
    await waitFor(() => expect(screen.getByText(/Party size: 2/)).toBeInTheDocument());

    // Toast should be shown with success message
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/guest added/i));
  });
});
