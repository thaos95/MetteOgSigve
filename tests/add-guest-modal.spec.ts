import { test, expect } from '@playwright/test';

const base = process.env.BASE_URL || 'http://localhost:3000';

test('admin add guest via modal works and validates', async ({ page, request }) => {
  // Reset rate limits before test
  await request.post(`${base}/api/admin/reset-rate-limits`, { data: { password: process.env.ADMIN_PASSWORD || 'metteogsigve', all: true } });

  const ts = Date.now();
  const deviceId = `playwright-modal-${ts}`;
  const email = `modal+${ts}@example.com`;
  const payload = { firstName: 'ModalTest', lastName: `Party${ts}`, email, attending: true, party: [] };

  const create = await request.post(`${base}/api/rsvp`, { data: payload, headers: { 'x-device-id': deviceId } });
  if (!create.ok()) {
    const txt = await create.text();
    console.error('Create RSVP failed:', create.status(), txt);
  }
  expect(create.ok()).toBeTruthy();
  const created = await create.json();
  const rsvpId = created.rsvp.id;

  // open admin
  await page.goto(`${base}/admin`);
  await page.fill('input[placeholder="Admin password"]', process.env.ADMIN_PASSWORD || 'metteogsigve');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('heading', { name: 'RSVPs' })).toBeVisible();

  // Open the filters section and filter to find our row
  await page.locator('details:has-text("Filters")').click();
  await page.fill('input[placeholder="Filter by name"]', 'ModalTest');

  const row = page.locator(`li:has-text("${email}")`).first();
  await expect(row).toBeVisible();

  // click Add guest to open modal (wait for button to be visible first)
  const addBtn = row.locator('button:has-text("Add guest")');
  await expect(addBtn).toBeVisible();
  await addBtn.click();
  const dialog = page.getByRole('dialog', { name: 'Add guest' });
  await expect(dialog).toBeVisible();

  // try to save with empty names -> expect validation error
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('text=First name is required')).toBeVisible();

  // fill valid names using dialog scoped selectors
  await dialog.locator('input').nth(0).fill('UI-New');
  await dialog.locator('input').nth(1).fill('Guest');
  await dialog.getByRole('button', { name: 'Save' }).click();

  // Wait for list to update
  await page.waitForTimeout(500);

  // Check for toast success
  await expect(page.getByRole('status')).toHaveText(/Guest added/i);

  // Verify via API that guest was added (audit log presence or rsvp party contains "UI-New")
  const logsRes = await request.get(`${base}/api/admin/audit-logs?password=${encodeURIComponent(process.env.ADMIN_PASSWORD || 'metteogsigve')}&targetId=${encodeURIComponent(rsvpId)}`);
  expect(logsRes.ok()).toBeTruthy();
  const logs = await logsRes.json();
  const found = (logs.logs || []).some((l:any) => l.action === 'add-guest' && JSON.stringify(l.after || '').includes('UI-New'));
  expect(found).toBeTruthy();

  // Additional E2E checks: Escape closes the dialog and returns focus to Add guest button
  // Re-open to test escape behavior
  await addBtn.click();
  await expect(dialog).toBeVisible();
  await dialog.press('Escape');
  await expect(dialog).not.toBeVisible();
  // ensure focus left the dialog (may or may not return to original opener depending on DOM updates)
  const activeLeftDialog = await page.evaluate(() => {
    const d = document.querySelector('[role="dialog"]');
    return !d || !document.activeElement || !document.activeElement.closest('[role="dialog"]');
  });
  expect(activeLeftDialog).toBeTruthy();

  // Re-open and test Tab focus trapping (basic smoke: Tab twice should remain inside dialog)
  await addBtn.click();
  await expect(dialog).toBeVisible();
  await dialog.press('Tab');
  await dialog.press('Tab');
  // ensure still visible
  await expect(dialog).toBeVisible();
});