import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import user from '@testing-library/user-event';
import { vi } from 'vitest';
import AdminPage from '../page';

/**
 * Admin Page Tests
 * 
 * SIMPLIFIED MODEL (2024):
 * - One person per RSVP (no party management)
 * - No verified/unverified distinction
 */
const testRsvp = { 
  id: 1, 
  name: 'Test Guest', 
  email: 'test@example.com', 
  attending: true, 
  first_name: 'Test', 
  last_name: 'Guest', 
  notes: 'Test notes',
  created_at: new Date().toISOString()
};

describe('AdminPage basic flow', () => {
  let fetchMock: any;

  beforeEach(() => {
    fetchMock = vi.fn(async (url: string, opts?: any) => {
      if (url.endsWith('/api/admin/rsvps') && opts?.method === 'POST') {
        return { ok: true, json: async () => ({ rsvps: [testRsvp] }) };
      }
      return { ok: true, json: async () => ({}) };
    });
    (globalThis as any).fetch = fetchMock;
  });

  afterEach(() => vi.restoreAllMocks());

  test('login and display RSVP list', async () => {
    render(<AdminPage />);

    // login with password
    await user.type(screen.getByPlaceholderText(/Admin password/i), 'pw');
    await user.click(screen.getByRole('button', { name: /login/i }));

    // wait for login to complete and rsvp to be shown
    await waitFor(() => {
      const els = screen.getAllByText(/Test Guest/);
      expect(els.length).toBeGreaterThan(0);
    });

    // Stats should be displayed - use getAllByText since "Attending" appears multiple times (stat card + filter options)
    await waitFor(() => expect(screen.getByText(/Total RSVPs/i)).toBeInTheDocument());
    await waitFor(() => expect(screen.getAllByText(/Attending/i).length).toBeGreaterThan(0));
  });

  test('displays RSVP details correctly', async () => {
    render(<AdminPage />);

    // login
    await user.type(screen.getByPlaceholderText(/Admin password/i), 'pw');
    await user.click(screen.getByRole('button', { name: /login/i }));

    // wait for rsvp to be shown with attending status
    await waitFor(() => expect(screen.getByText(/Kommer/i)).toBeInTheDocument());
    
    // email should be displayed
    await waitFor(() => expect(screen.getByText(/test@example.com/i)).toBeInTheDocument());
  });
});
