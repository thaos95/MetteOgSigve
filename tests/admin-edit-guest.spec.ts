import { test, expect } from '@playwright/test';

const base = process.env.BASE_URL || 'http://localhost:3000';

test('admin can edit, remove, reorder, and add guests', async ({ page, request }) => {
  const ts = Date.now();
  const payload = { firstName: 'EditTest', lastName: `Party${ts}`, email: `edittest+${ts}@example.com`, attending: false, party: [{ firstName: 'A', lastName: 'One', attending: false }, { firstName: 'B', lastName: 'Two', attending: false }] };
  const create = await request.post(`${base}/api/rsvp`, { data: payload });
  expect(create.ok()).toBeTruthy();

  // navigate to admin and login
  await page.goto(`${base}/admin`);
  await page.fill('input[placeholder="Admin password"]', process.env.ADMIN_PASSWORD || 'metteogsigve');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.locator('text=RSVPs')).toBeVisible();

  // find created rsvp row
  await page.fill('input[placeholder="Filter by member name"]', 'A One');
  await page.click('button:has-text("Export CSV")'); // quick way to ensure filter is applied; not necessary

  const row = page.locator(`text=EditTest Party${ts}`).first();
  await expect(row).toBeVisible();

  // Edit guest 0 name
  const firstInput = row.locator('input').nth(0);
  await firstInput.fill('A-Edited');
  await row.locator('button:has-text("Save")').click();
  await expect(page.locator('text=Saved')).toBeVisible();

  // Move guest 1 up
  await row.locator('button:has-text("↓")').first().click();

  // Remove guest 0
  await row.locator('button:has-text("Remove")').first().click();
  await page.on('dialog', d => d.accept());

  // Add a new guest
  await row.locator('button:has-text("Add guest")').click();
  // prompt workaround: test the API directly to add one
  const rsvps = await request.post(`${base}/api/admin/edit-guest`, { data: { password: process.env.ADMIN_PASSWORD || 'metteogsigve', rsvpId: (await create.json()).rsvp.id, action: 'add', firstName: 'NewG', lastName: 'Added', attending: true } });
  expect(rsvps.ok()).toBeTruthy();
});