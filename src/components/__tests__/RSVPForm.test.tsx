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
    // fill guest inputs - look for the sr-only labeled inputs for Guest 1
    const firstGuest = screen.getByLabelText(/Guest 1 first name/i);
    const lastGuest = screen.getByLabelText(/Guest 1 last name/i);
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

    // uncheck both by toggling each guest checkbox (filter by label text)
    const checkboxes = screen.getAllByRole('checkbox');
    const guestCheckboxes = checkboxes.filter(cb => {
      const label = cb.closest('label')?.textContent?.trim();
      return label === 'Attending';
    });
    for (const cb of guestCheckboxes) await user.click(cb); // toggle off

    // ensure they're unchecked
    for (const cb of guestCheckboxes) expect(cb).not.toBeChecked();

    // click mark all attending (button text changed to "All attending")
    await user.click(screen.getByRole('button', { name: /all attending/i }));

    // now they should be checked (filter by label again)
    const postCheckboxes = screen.getAllByRole('checkbox').filter(cb => {
      const label = cb.closest('label')?.textContent?.trim();
      return label === 'Attending';
    });
    for (const cb of postCheckboxes) expect(cb).toBeChecked();
  });

  test('submits update with pasted token when provided', async () => {
    // prepare fetch mock: first call for verify-token, second for PUT
    const verifyRes = { ok: true, json: async () => ({ ok: true, rsvp: { id: 'rsvp-1', first_name: 'Existing', last_name: 'Person', email: 'existing@example.com', party: [] } }) };
    const putRes = { ok: true };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(verifyRes)
      .mockResolvedValueOnce(putRes);
    (globalThis as any).fetch = fetchMock;

    render(<RSVPForm />);

    await user.type(screen.getByLabelText(/first name/i), 'Jane');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    
    // Expand the token management section (it's in a details element now)
    await user.click(screen.getByText(/Need to edit or cancel/i));
    
    await user.type(screen.getByPlaceholderText(/Paste token/i), 'token-abc');

    // click Use token to load RSVP
    await user.click(screen.getByRole('button', { name: /Use token/i }));

    // now submit update (handle either Send or Update button text)
    const submitBtn = screen.getByRole('button', { name: /send rsvp|update rsvp/i });
    await user.click(submitBtn);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const opts = fetchMock.mock.calls[1][1];
    const body = JSON.parse(opts.body);
    // token should be present in payload (as token field when editing)
    expect(body.token).toBe('token-abc');
    expect(body.id).toBe('rsvp-1');
  });

  test('request-token includes sendToEmail and updateEmail', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    (globalThis as any).fetch = fetchMock;

    render(<RSVPForm />);

    // fill email
    await user.type(screen.getByLabelText(/^Email$/i), 'alice@example.com');
    
    // Expand the token management section (it's in a details element now)
    await user.click(screen.getByText(/Need to edit or cancel/i));
    
    // fill send-to email and check update checkbox
    await user.type(screen.getByLabelText(/Send link to email/i), 'alt@example.com');
    await user.click(screen.getByLabelText(/Update RSVP email/i));

    await user.click(screen.getByRole('button', { name: /Request edit\/cancel link/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const opts = fetchMock.mock.calls[0][1];
    const body = JSON.parse(opts.body);
    expect(body.sendToEmail).toBe('alt@example.com');
    expect(body.updateEmail).toBe(true);
  });

  test('dev generate token fills pasted token', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ token: 'dev-123' }) });
    (globalThis as any).fetch = fetchMock;

    render(<RSVPForm />);

    await user.type(screen.getByLabelText(/^Email$/i), 'bob@example.com');
    
    // Expand the token management section (it's in a details element now)
    await user.click(screen.getByText(/Need to edit or cancel/i));
    
    await user.click(screen.getByRole('button', { name: /Generate test token \(dev\)/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    // pasted token input should now contain dev token
    const pasted = screen.getByPlaceholderText(/Paste token here/i) as HTMLInputElement;
    expect(pasted.value).toBe('dev-123');
  });
});
