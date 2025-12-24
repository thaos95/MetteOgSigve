import { test, expect } from '@playwright/test';

const base = process.env.BASE_URL || 'http://localhost:3000';

test('audit logs modal displays recent admin actions and detail view', async ({ page, request }) => {
  const ts = Date.now();
  const payload = { firstName: 'AuditUI', lastName: `Party${ts}`, email: `auditui+${ts}@example.com`, attending: false, party: [] };

  // Create RSVP
  const create = await request.post(`${base}/api/rsvp`, { data: payload });
  expect(create.ok()).toBeTruthy();
  const created = await create.json();
  const rsvpId = created.rsvp.id;

  // Trigger admin action: add guest via API
  const add = await request.post(`${base}/api/admin/edit-guest`, { data: { password: process.env.ADMIN_PASSWORD || 'metteogsigve', rsvpId, action: 'add', firstName: 'NewG', lastName: 'Added', attending: true } });
  expect(add.ok()).toBeTruthy();

  // Wait for audit log entry to be available via API (poll)
  let found = false;
  for (let i = 0; i < 20; i++) {
    const logsRes = await request.get(`${base}/api/admin/audit-logs?password=${encodeURIComponent(process.env.ADMIN_PASSWORD || 'metteogsigve')}&targetId=${encodeURIComponent(rsvpId)}`);
    if (!logsRes.ok()) {
      await new Promise(r => setTimeout(r, 300));
      continue;
    }
    const js = await logsRes.json();
    const logs = js.logs || [];
    if (logs.some((l:any) => l.action === 'add-guest')) { found = true; break; }
    await new Promise(r => setTimeout(r, 300));
  }
  expect(found, 'expected add-guest audit log to appear').toBeTruthy();

  // Open admin UI
  await page.goto(`${base}/admin`);
  await page.fill('input[placeholder="Admin password"]', process.env.ADMIN_PASSWORD || 'metteogsigve');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.locator('text=RSVPs')).toBeVisible();

  // Open audit logs modal
  await page.getByRole('button', { name: 'Open audit logs' }).click();
  await expect(page.locator('text=Admin Audit Logs')).toBeVisible();

  // Ensure a row referencing the rsvp or action exists
  const row = page.locator('table').locator('tr').filter({ hasText: 'add-guest' }).first();
  await expect(row).toBeVisible();

  // View details and assert the after JSON includes the guest name
  await row.locator('button:has-text("View")').click();
  await expect(page.locator('text=Audit detail')).toBeVisible();
  await expect(page.locator('pre')).toContainText('NewG');
});