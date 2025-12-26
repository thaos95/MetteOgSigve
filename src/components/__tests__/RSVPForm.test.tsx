import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import user from '@testing-library/user-event';
import { vi } from 'vitest';
import RSVPForm from '../RSVPForm';

/**
 * RSVPForm Unit Tests
 * 
 * SIMPLIFIED MODEL (2024):
 * - One person per RSVP (no party members)
 * - Email is optional
 */
describe('RSVPForm', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    // clear any device id
    try { localStorage.removeItem('__device_id'); } catch (e) { }
  });

  test('submits payload with x-device-id header when present', async () => {
    // set device id
    try { localStorage.setItem('__device_id', 'device-123'); } catch (e) { }

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, rsvp: { id: 'new-id' } }) });
    (globalThis as any).fetch = fetchMock;

    render(<RSVPForm />);

    await user.type(screen.getByLabelText(/Fornavn/i), 'Jane');
    await user.type(screen.getByLabelText(/Etternavn/i), 'Doe');

    // submit
    await user.click(screen.getByRole('button', { name: /Send svar/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const [url, opts] = [fetchMock.mock.calls[0][0], fetchMock.mock.calls[0][1]];
    expect(url).toMatch(/\/api\/rsvp/);
    expect(opts.method).toBe('POST');

    // headers include x-device-id
    expect(opts.headers['x-device-id']).toBe('device-123');

    const body = JSON.parse(opts.body);
    expect(body.firstName).toBe('Jane');
    expect(body.lastName).toBe('Doe');
  });

  test('submits with optional email', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, rsvp: { id: 'new-id' } }) });
    (globalThis as any).fetch = fetchMock;

    render(<RSVPForm />);

    await user.type(screen.getByLabelText(/Fornavn/i), 'Jane');
    await user.type(screen.getByLabelText(/Etternavn/i), 'Doe');
    // Use the specific email field by id (not the send-to-email field)
    await user.type(document.getElementById('email')!, 'jane@example.com');

    await user.click(screen.getByRole('button', { name: /Send svar/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.email).toBe('jane@example.com');
  });

  test('submits without email (email is optional)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, rsvp: { id: 'new-id' } }) });
    (globalThis as any).fetch = fetchMock;

    render(<RSVPForm />);

    await user.type(screen.getByLabelText(/Fornavn/i), 'Jane');
    await user.type(screen.getByLabelText(/Etternavn/i), 'Doe');
    // do not fill email

    await user.click(screen.getByRole('button', { name: /Send svar/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.firstName).toBe('Jane');
    // email is null when not provided (falsy check)
    expect(body.email == null || body.email === '').toBe(true);
  });

  test('submits update with pasted token when provided', async () => {
    // prepare fetch mock: first call for verify-token, second for PUT
    const verifyRes = { ok: true, json: async () => ({ ok: true, rsvp: { id: 'rsvp-1', first_name: 'Existing', last_name: 'Person', email: 'existing@example.com' } }) };
    const putRes = { ok: true, json: async () => ({ ok: true }) };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(verifyRes)
      .mockResolvedValueOnce(putRes);
    (globalThis as any).fetch = fetchMock;

    render(<RSVPForm />);

    await user.type(screen.getByLabelText(/Fornavn/i), 'Jane');
    await user.type(screen.getByLabelText(/Etternavn/i), 'Doe');
    
    // Expand the token management section (it's in a details element now)
    await user.click(screen.getByText(/Trenger du å endre eller kansellere/i));
    
    await user.type(screen.getByPlaceholderText(/Lim inn token/i), 'token-abc');

    // click Use token to load RSVP
    await user.click(screen.getByRole('button', { name: /Bruk token/i }));

    // now submit update (handle either Send or Update button text)
    const submitBtn = screen.getByRole('button', { name: /Send svar|Oppdater svar/i });
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

    // fill email using specific id
    await user.type(document.getElementById('email')!, 'alice@example.com');
    
    // Expand the token management section (it's in a details element now)
    await user.click(screen.getByText(/Trenger du å endre eller kansellere/i));
    
    // fill send-to email and check update checkbox
    await user.type(screen.getByLabelText(/Send lenke til e-post/i), 'alt@example.com');
    await user.click(screen.getByLabelText(/Oppdater svar-epost/i));

    await user.click(screen.getByRole('button', { name: /Be om endrings-\/slettelenke/i }));

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

    // fill email using specific id
    await user.type(document.getElementById('email')!, 'bob@example.com');
    
    // Expand the token management section (it's in a details element now)
    await user.click(screen.getByText(/Trenger du å endre eller kansellere/i));
    
    await user.click(screen.getByRole('button', { name: /Generer testtoken \(dev\)/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    // pasted token input should now contain dev token
    const pasted = screen.getByPlaceholderText(/Lim inn token her/i) as HTMLInputElement;
    expect(pasted.value).toBe('dev-123');
  });
});
