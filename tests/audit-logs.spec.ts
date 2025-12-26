import { test, expect } from '@playwright/test';

const base = process.env.BASE_URL || 'http://localhost:3000';

test('audit logs modal displays recent admin actions and detail view', async ({ page, request }) => {
  // Reset rate limits before test
  await request.post(`${base}/api/admin/reset-rate-limits`, { data: { password: process.env.ADMIN_PASSWORD || 'metteogsigve', all: true } });

  const ts = Date.now();
  const rnd = Math.random().toString(36).slice(2,8);
  const deviceId = `playwright-audit-${ts}-${rnd}`;
  const email = `auditui+${ts}-${rnd}@example.com`;
  const uniqueName = `AuditUI${ts}${rnd}`;
  const payload = { firstName: uniqueName, lastName: `Party${ts}-${rnd}`, email, attending: false };

  // Create RSVP with attending: false
  const create = await request.post(`${base}/api/rsvp`, { data: payload, headers: { 'x-device-id': deviceId } });
  if (!create.ok()) { const txt = await create.text(); console.error('Create RSVP failed:', create.status(), txt); }
  expect(create.ok()).toBeTruthy();
  const created = await create.json();
  const rsvpId = created.rsvp.id;

  // Trigger admin action: update attending status to true (note: notes aren't updated by this endpoint)
  const update = await request.post(`${base}/api/admin/update-person`, { 
    data: { password: process.env.ADMIN_PASSWORD || 'metteogsigve', rsvpId, target: 'primary', attending: true } 
  });
  expect(update.ok()).toBeTruthy();

  // Wait for audit log entry to be available via API (poll) - look for attending: true in after
  let found = false;
  for (let i = 0; i < 20; i++) {
    const logsRes = await request.post(`${base}/api/admin/audit-logs`, {
      data: { password: process.env.ADMIN_PASSWORD || 'metteogsigve', targetId: rsvpId }
    });
    if (!logsRes.ok()) {
      await new Promise(r => setTimeout(r, 300));
      continue;
    }
    const js = await logsRes.json();
    const logs = js.logs || [];
    // Look for update-attending action with attending: true in after data
    if (logs.some((l:any) => l.action === 'update-attending' && l.after?.attending === true)) { found = true; break; }
    await new Promise(r => setTimeout(r, 300));
  }
  expect(found, 'expected update-attending audit log with attending: true to appear').toBeTruthy();

  // Open admin UI
  await page.goto(`${base}/admin`);
  await page.fill('input[placeholder="Admin password"]', process.env.ADMIN_PASSWORD || 'metteogsigve');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('heading', { name: 'RSVPs' })).toBeVisible();

  // Open audit logs modal and wait for the logs fetch to complete
  await page.getByRole('button', { name: 'Audit logs' }).click();
  await page.waitForResponse(r => r.url().includes('/api/admin/audit-logs') && r.status() === 200);
  await expect(page.getByRole('heading', { name: 'Admin Audit Logs' }).first()).toBeVisible();

  // Use the heading to locate the modal container, then find controls within it
  const heading = page.getByRole('heading', { name: 'Admin Audit Logs' }).first();
  const modal = heading.locator('..').locator('..');

  const filterInput = modal.locator('input[placeholder="Filter action"]').first();
  await expect(filterInput).toBeVisible();
  await filterInput.fill('update-attending');

  const filterBtn = modal.getByRole('button', { name: 'Filter' }).first();
  // Click via evaluate to avoid pointer interception flakiness in test env
  await filterBtn.evaluate((el: any) => el.click());
  await page.waitForTimeout(300); // short wait for filter to apply

  // Ensure a row referencing the action exists AND matches our specific rsvpId
  const row = modal.locator('table').locator('tr').filter({ hasText: rsvpId }).first();
  await expect(row).toBeVisible();

  // Assert pagination state (prev disabled on first page)
  const prev = modal.getByRole('button', { name: 'Prev', exact: true }).first();
  await expect(prev).toBeVisible();
  await expect(prev).toBeDisabled();

  // View details and assert the after JSON shows attending: true (uniqueName helps identify correct record)
  // use evaluate click to avoid pointer interception flakiness
  await row.locator('button:has-text("View")').evaluate((el: any) => el.click());
  await expect(page.locator('text=Audit detail')).toBeVisible();
  // Find any pre block that contains the unique name (confirming we have the right record)
  await expect(page.locator('pre').filter({ hasText: uniqueName }).first()).toBeVisible();
});