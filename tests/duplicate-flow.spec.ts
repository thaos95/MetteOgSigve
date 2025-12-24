import { test, expect } from '@playwright/test';

const base = process.env.BASE_URL || 'http://localhost:3000';

test('duplicate prompt flow: shows existing suggestion and can create anyway', async ({ page, request }) => {
  // Reset rate limits before test
  await request.post(`${base}/api/admin/reset-rate-limits`, { data: { password: process.env.ADMIN_PASSWORD || 'metteogsigve', all: true } });

  // ensure a fresh test RSVP exists via API
  const ts = Date.now();
  const rnd = Math.random().toString(36).slice(2,8);
  const primary = { firstName: 'Test', lastName: `Dup${ts}-${rnd}`, email: `dup+${ts}-${rnd}@example.com`, attending: true, party: [{ firstName: 'Guest', lastName: `Dup${ts}-${rnd}`, attending: true }] };
  const deviceId = `playwright-dup-${ts}-${rnd}`;
  const createRes = await request.post(`${base}/api/rsvp`, { data: primary, headers: { 'x-device-id': deviceId } });
  if (!createRes.ok()) { const txt = await createRes.text(); console.error('Create RSVP failed:', createRes.status(), txt); }
  expect(createRes.ok()).toBeTruthy();

  // Now navigate to the site and attempt a fuzzy duplicate
  await page.goto(`${base}/rsvp`);
  await page.getByLabel('First name').fill('Test');
  await page.getByLabel('Last name').fill(`Dup${ts}`);
  await page.getByLabel('Email', { exact: true }).fill(`dup+${ts}+2@example.com`);
  await page.getByRole('button', { name: 'Send RSVP' }).click();

  // Wait for the duplicate prompt UI - updated to match new text
  await expect(page.locator('text=Existing RSVP Found')).toBeVisible();

  // Click create new anyway and wait for confirmation
  await page.click('button:has-text("Create new anyway")');
  // Updated to match new success message
  await expect(page.locator('text=Your RSVP has been')).toBeVisible();
});