import { test, expect } from '@playwright/test';

const base = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Admin API security', () => {
  test('all admin endpoints reject requests without password', async ({ request }) => {
    const endpoints = [
      { url: '/api/admin/rsvps', method: 'POST', body: {} },
      { url: '/api/admin/edit-guest', method: 'POST', body: { rsvpId: '123', action: 'add' } },
      { url: '/api/admin/update-person', method: 'POST', body: { rsvpId: '123', target: 'primary', attending: true } },
      { url: '/api/admin/export-rsvps', method: 'POST', body: {} },
      { url: '/api/admin/email-rsvps', method: 'POST', body: { to: 'test@example.com' } },
      { url: '/api/admin/audit-logs', method: 'POST', body: {} },
      { url: '/api/admin/clear-rsvps', method: 'POST', body: { confirm: 'DELETE' } },
      { url: '/api/admin/reset-rate-limits', method: 'POST', body: { all: true } },
      { url: '/api/admin/remove-sentinel', method: 'POST', body: {} },
      { url: '/api/admin/alter-rsvps', method: 'POST', body: {} },
      { url: '/api/admin/test-send-email', method: 'POST', body: {} },
    ];

    for (const ep of endpoints) {
      const res = await request.post(`${base}${ep.url}`, { data: ep.body });
      expect(res.status(), `${ep.url} should reject missing password`).toBe(401);
      const json = await res.json().catch(() => ({}));
      expect(json.error, `${ep.url} should return unauthorized error`).toMatch(/unauthorized/i);
    }
  });

  test('all admin endpoints reject requests with wrong password', async ({ request }) => {
    const endpoints = [
      { url: '/api/admin/rsvps', body: { password: 'wrongpassword' } },
      { url: '/api/admin/edit-guest', body: { password: 'wrongpassword', rsvpId: '123', action: 'add' } },
      { url: '/api/admin/update-person', body: { password: 'wrongpassword', rsvpId: '123', target: 'primary', attending: true } },
      { url: '/api/admin/export-rsvps', body: { password: 'wrongpassword' } },
      { url: '/api/admin/email-rsvps', body: { password: 'wrongpassword', to: 'test@example.com' } },
      { url: '/api/admin/audit-logs', body: { password: 'wrongpassword' } },
      { url: '/api/admin/clear-rsvps', body: { password: 'wrongpassword', confirm: 'DELETE' } },
      { url: '/api/admin/reset-rate-limits', body: { password: 'wrongpassword', all: true } },
      { url: '/api/admin/remove-sentinel', body: { password: 'wrongpassword' } },
      { url: '/api/admin/alter-rsvps', body: { password: 'wrongpassword' } },
      { url: '/api/admin/test-send-email', body: { password: 'wrongpassword' } },
    ];

    for (const ep of endpoints) {
      const res = await request.post(`${base}${ep.url}`, { data: ep.body });
      expect(res.status(), `${ep.url} should reject wrong password`).toBe(401);
    }
  });

  test('clear-rsvps requires explicit confirmation', async ({ request }) => {
    const password = process.env.ADMIN_PASSWORD || 'metteogsigve';
    
    // Without confirmation
    const noConfirm = await request.post(`${base}/api/admin/clear-rsvps`, {
      data: { password }
    });
    expect(noConfirm.status()).toBe(400);
    const json = await noConfirm.json();
    expect(json.error).toContain('confirmation required');

    // With wrong confirmation
    const wrongConfirm = await request.post(`${base}/api/admin/clear-rsvps`, {
      data: { password, confirm: 'WRONG' }
    });
    expect(wrongConfirm.status()).toBe(400);
  });

  test('export-rsvps returns CSV with correct headers', async ({ request }) => {
    const password = process.env.ADMIN_PASSWORD || 'metteogsigve';
    
    const res = await request.post(`${base}/api/admin/export-rsvps`, {
      data: { password }
    });
    expect(res.ok()).toBeTruthy();
    
    const contentType = res.headers()['content-type'];
    expect(contentType).toContain('text/csv');
    
    const disposition = res.headers()['content-disposition'];
    expect(disposition).toContain('attachment');
    expect(disposition).toContain('.csv');
  });

  test('audit logs are created for admin actions', async ({ request }) => {
    const password = process.env.ADMIN_PASSWORD || 'metteogsigve';
    const ts = Date.now();
    const rnd = Math.random().toString(36).slice(2, 8);
    const deviceId = `playwright-audit-sec-${ts}-${rnd}`;
    
    // Reset rate limits
    await request.post(`${base}/api/admin/reset-rate-limits`, {
      data: { password, all: true }
    });

    // Create a test RSVP
    const create = await request.post(`${base}/api/rsvp`, {
      data: { firstName: 'AuditSec', lastName: `Test${ts}`, email: `auditsec+${ts}@example.com`, attending: true, party: [] },
      headers: { 'x-device-id': deviceId }
    });
    expect(create.ok()).toBeTruthy();
    const rsvpId = (await create.json()).rsvp.id;

    // Perform admin action
    const edit = await request.post(`${base}/api/admin/edit-guest`, {
      data: { password, rsvpId, action: 'add', firstName: 'NewPerson', lastName: 'Test', attending: true }
    });
    expect(edit.ok()).toBeTruthy();

    // Verify audit log was created
    const logs = await request.post(`${base}/api/admin/audit-logs`, {
      data: { password, targetId: rsvpId }
    });
    expect(logs.ok()).toBeTruthy();
    const logsJson = await logs.json();
    expect(logsJson.logs.length).toBeGreaterThan(0);
    
    const addGuestLog = logsJson.logs.find((l: any) => l.action === 'add-guest');
    expect(addGuestLog).toBeTruthy();
    expect(addGuestLog.target_table).toBe('rsvps');
    expect(addGuestLog.before).toBeTruthy();
    expect(addGuestLog.after).toBeTruthy();
  });
});
