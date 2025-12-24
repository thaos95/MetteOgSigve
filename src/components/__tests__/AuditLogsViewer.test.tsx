import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import user from '@testing-library/user-event';
import { vi } from 'vitest';
import AuditLogsViewer from '../AuditLogsViewer';

const sampleLog = {
  id: 1,
  admin_email: 'admin@example.com',
  action: 'edit_guest',
  target_table: 'rsvps',
  target_id: '42',
  ip: '1.2.3.4',
  device_id: 'device-1',
  metadata: { foo: 'bar' },
  before: { guests: [] },
  after: { guests: [{ firstName: 'Alice' }] },
  created_at: new Date().toISOString()
};

describe('AuditLogsViewer', () => {
  let fetchMock: any;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ logs: [sampleLog], count: 1 }) });
    (globalThis as any).fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('fetches and displays logs and shows details modal', async () => {
    render(<AuditLogsViewer password="pw" onClose={() => {}} />);

    // Changed from GET to POST - verify POST call with body
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/audit-logs', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.stringContaining('"password":"pw"')
    }));

    await waitFor(() => expect(screen.getByText(/Showing 1 of 1 logs/i)).toBeInTheDocument());

    // Check table shows row
    expect(screen.getByText(/admin@example.com/i)).toBeInTheDocument();
    expect(screen.getByText(/edit_guest/i)).toBeInTheDocument();

    // Click View to open details
    await user.click(screen.getByRole('button', { name: /view/i }));

    expect(await screen.findByText(/Audit detail/i)).toBeInTheDocument();
    expect(screen.getByText(/Before/i)).toBeInTheDocument();
    expect(screen.getByText(/After/i)).toBeInTheDocument();
    // JSON content should include Alice
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
  });

  test('applies filters when set and calls fetch with params', async () => {
    render(<AuditLogsViewer password="pw" onClose={() => {}} />);

    // initial call
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // set filters
    await user.type(screen.getByPlaceholderText(/Filter admin email/i), 'admin@example.com');
    await user.type(screen.getByPlaceholderText(/Filter action/i), 'edit_guest');
    await user.click(screen.getByRole('button', { name: /filter/i }));

    await waitFor(() => {
      // Changed from GET query params to POST body - verify body contains filters
      const called = fetchMock.mock.calls.find((c: any) => {
        if (c[1]?.body) {
          const body = JSON.parse(c[1].body);
          return body.adminEmail === 'admin@example.com' && body.action === 'edit_guest';
        }
        return false;
      });
      expect(called).toBeTruthy();
    });
  });
});
