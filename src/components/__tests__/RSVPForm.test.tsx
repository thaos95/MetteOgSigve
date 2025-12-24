import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import user from '@testing-library/user-event';
import { vi } from 'vitest';
import RSVPForm from '../RSVPForm';

describe('RSVPForm', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    // clear any device id
    try { localStorage.removeItem('__device_id'); } catch (e) { }
  });

  test('submits payload including party and x-device-id header when present', async () => {
    // set device id
    try { localStorage.setItem('__device_id', 'device-123'); } catch (e) { }

    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    (globalThis as any).fetch = fetchMock;

    render(<RSVPForm />);

    await user.type(screen.getByLabelText(/first name/i), 'Jane');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');

    // add a party member
    await user.click(screen.getByRole('button', { name: /add guest/i }));
    // fill guest inputs
    const firstGuest = screen.getAllByPlaceholderText(/First/i)[0];
    const lastGuest = screen.getAllByPlaceholderText(/Last/i)[0];
    await user.type(firstGuest, 'GuestFirst');
    await user.type(lastGuest, 'GuestLast');

    // submit
    await user.click(screen.getByRole('button', { name: /send rsvp/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const [url, opts] = [fetchMock.mock.calls[0][0], fetchMock.mock.calls[0][1]];
    expect(url).toMatch(/\/api\/rsvp/);
    expect(opts.method).toBe('POST');

    // headers include x-device-id
    expect(opts.headers['x-device-id']).toBe('device-123');

    const body = JSON.parse(opts.body);
    expect(body.firstName).toBe('Jane');
    expect(Array.isArray(body.party)).toBe(true);
    expect(body.party[0].firstName).toBe('GuestFirst');
  });

  test('mark all attending toggles party attendance', async () => {
    render(<RSVPForm />);

    await user.click(screen.getByRole('button', { name: /add guest/i }));
    await user.click(screen.getByRole('button', { name: /add guest/i }));

    // uncheck both by toggling each checkbox
    const checkboxes = screen.getAllByRole('checkbox');
    // the first checkbox is the main attending radio, the rest include guest attending checkboxes
    // find guest attending checkboxes by excluding the first
    const guestCheckboxes = checkboxes.slice(1);
    for (const cb of guestCheckboxes) await user.click(cb); // toggle off

    // ensure they're unchecked
    for (const cb of guestCheckboxes) expect(cb).not.toBeChecked();

    // click mark all attending
    await user.click(screen.getByRole('button', { name: /mark all attending/i }));

    // now they should be checked
    const postCheckboxes = screen.getAllByRole('checkbox').slice(1);
    for (const cb of postCheckboxes) expect(cb).toBeChecked();
  });
});
