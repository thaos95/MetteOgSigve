import { test, expect } from '@playwright/test';

const base = process.env.BASE_URL || 'http://localhost:3000';

test('duplicate prompt flow: shows existing suggestion and can create anyway', async ({ page, request }) => {
  // ensure a fresh test RSVP exists via API
  const ts = Date.now();
  const primary = { firstName: 'Test', lastName: `Dup${ts}`, email: `dup+${ts}@example.com`, attending: true, party: [{ firstName: 'Guest', lastName: `Dup${ts}`, attending: true }] };
  const createRes = await request.post(`${base}/api/rsvp`, { data: primary });
  expect(createRes.ok()).toBeTruthy();

  // Now navigate to the site and attempt a fuzzy duplicate
  await page.goto(`${base}/rsvp`);
  await page.getByLabel('First name').fill('Test');
  await page.getByLabel('Last name').fill(`Dup${ts}`);
  await page.getByLabel('Email').fill(`dup+${ts}+2@example.com`);
  await page.getByRole('button', { name: 'Send RSVP' }).click();

  // Wait for the duplicate prompt UI
  await expect(page.locator('text=We found an existing RSVP that may match')).toBeVisible();

  // Click create new anyway and wait for confirmation
  await page.click('button:has-text("Create new anyway")');
  await expect(page.locator('text=Thanks — your RSVP has been')).toBeVisible();
});