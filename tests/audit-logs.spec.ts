import { test, expect } from '@playwright/test';

const base = process.env.BASE_URL || 'http://localhost:3000';

test('audit logs modal displays recent admin actions and detail view', async ({ page, request }) => {
  const ts = Date.now();
  const rnd = Math.random().toString(36).slice(2,8);
  const deviceId = `playwright-audit-${ts}-${rnd}`;
  const email = `auditui+${ts}-${rnd}@example.com`;
  const payload = { firstName: 'AuditUI', lastName: `Party${ts}-${rnd}`, email, attending: false, party: [] };

  // Create RSVP
  const create = await request.post(`${base}/api/rsvp`, { data: payload, headers: { 'x-device-id': deviceId } });
  if (!create.ok()) { const txt = await create.text(); console.error('Create RSVP failed:', create.status(), txt); }
  expect(create.ok()).toBeTruthy();
  const created = await create.json();
  const rsvpId = created.rsvp.id;

  // Trigger admin action: add guest via API (NewG)
  const add = await request.post(`${base}/api/admin/edit-guest`, { data: { password: process.env.ADMIN_PASSWORD || 'metteogsigve', rsvpId, action: 'add', firstName: 'NewG', lastName: 'Added', attending: true } });
  expect(add.ok()).toBeTruthy();

  // Wait for audit log entry to be available via API (poll) and assert it references NewG in 'after'
  let found = false;
  for (let i = 0; i < 20; i++) {
    const logsRes = await request.get(`${base}/api/admin/audit-logs?password=${encodeURIComponent(process.env.ADMIN_PASSWORD || 'metteogsigve')}&targetId=${encodeURIComponent(rsvpId)}`);
    if (!logsRes.ok()) {
      await new Promise(r => setTimeout(r, 300));
      continue;
    }
    const js = await logsRes.json();
    const logs = js.logs || [];
    if (logs.some((l:any) => l.action === 'add-guest' && JSON.stringify(l.after || '').includes('NewG'))) { found = true; break; }
    await new Promise(r => setTimeout(r, 300));
  }
  expect(found, 'expected add-guest audit log with NewG to appear').toBeTruthy();

  // Open admin UI
  await page.goto(`${base}/admin`);
  await page.fill('input[placeholder="Admin password"]', process.env.ADMIN_PASSWORD || 'metteogsigve');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('heading', { name: 'RSVPs' })).toBeVisible();

  // Open audit logs modal and wait for the logs fetch to complete
  await page.getByRole('button', { name: 'Open audit logs' }).click();
  await page.waitForResponse(r => r.url().includes('/api/admin/audit-logs') && r.status() === 200);
  await expect(page.getByRole('heading', { name: 'Admin Audit Logs' }).first()).toBeVisible();

  // Use the heading to locate the modal container, then find controls within it
  const heading = page.getByRole('heading', { name: 'Admin Audit Logs' }).first();
  const modal = heading.locator('..').locator('..');

  const filterInput = modal.locator('input[placeholder="Filter action"]').first();
  await expect(filterInput).toBeVisible();
  await filterInput.fill('add-guest');

  const filterBtn = modal.getByRole('button', { name: 'Filter' }).first();
  // Click via evaluate to avoid pointer interception flakiness in test env
  await filterBtn.evaluate((el: any) => el.click());
  await page.waitForTimeout(300); // short wait for filter to apply

  // Ensure a row referencing the action exists (scoped to the modal table)
  const row = modal.locator('table').locator('tr').filter({ hasText: 'add-guest' }).first();
  await expect(row).toBeVisible();

  // Assert pagination state (prev disabled on first page)
  const prev = modal.getByRole('button', { name: 'Prev', exact: true }).first();
  await expect(prev).toBeVisible();
  await expect(prev).toBeDisabled();

  // View details and assert the after JSON includes the guest name
  // use evaluate click to avoid pointer interception flakiness
  await row.locator('button:has-text("View")').evaluate((el: any) => el.click());
  await expect(page.locator('text=Audit detail')).toBeVisible();
  // Inspect the 'After' pre block (second one) for the new guest
  await expect(page.locator('pre').nth(1)).toContainText('NewG');
});