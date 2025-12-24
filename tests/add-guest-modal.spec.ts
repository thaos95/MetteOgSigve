import { test, expect } from '@playwright/test';

const base = process.env.BASE_URL || 'http://localhost:3000';

test('admin add guest via modal works and validates', async ({ page, request }) => {
  const ts = Date.now();
  const payload = { firstName: 'ModalTest', lastName: `Party${ts}`, email: `modal+${ts}@example.com`, attending: true, party: [] };

  const create = await request.post(`${base}/api/rsvp`, { data: payload });
  expect(create.ok()).toBeTruthy();
  const created = await create.json();
  const rsvpId = created.rsvp.id;

  // open admin
  await page.goto(`${base}/admin`);
  await page.fill('input[placeholder="Admin password"]', process.env.ADMIN_PASSWORD || 'metteogsigve');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.locator('text=RSVPs')).toBeVisible();

  // filter to find our row
  await page.fill('input[placeholder="Filter by member name"]', 'ModalTest');

  const row = page.locator(`text=ModalTest Party${ts}`).first();
  await expect(row).toBeVisible();

  // click Add guest to open modal
  await row.locator('button:has-text("Add guest")').click();
  await expect(page.locator('text=Add guest')).toBeVisible();

  // try to save with empty names -> expect validation error
  await page.click('button:has-text("Save")');
  await expect(page.locator('text=First name is required')).toBeVisible();

  // fill valid names
  await page.fill('input[placeholder="First name"]', 'UI-New');
  await page.fill('input[placeholder="Last name"]', 'Guest');
  // helpers: the inputs don't currently have placeholders; use selectors
  await page.fill('input[aria-invalid="false"]', 'UI-New');

  // better fill by label queries
  await page.fill('label:has-text("First name") >> input', 'UI-New');
  await page.fill('label:has-text("Last name") >> input', 'Guest');
  await page.click('button:has-text("Save")');

  // Wait for list to update
  await page.waitForTimeout(500);

  // Verify via API that guest was added (audit log presence or rsvp party contains "UI-New")
  const logsRes = await request.get(`${base}/api/admin/audit-logs?password=${encodeURIComponent(process.env.ADMIN_PASSWORD || 'metteogsigve')}&targetId=${encodeURIComponent(rsvpId)}`);
  expect(logsRes.ok()).toBeTruthy();
  const logs = await logsRes.json();
  const found = (logs.logs || []).some((l:any) => l.action === 'add-guest' && JSON.stringify(l.after || '').includes('UI-New'));
  expect(found).toBeTruthy();
});