import { test, expect } from '@playwright/test';

const base = process.env.BASE_URL || 'http://localhost:3000';

/**
 * Duplicate detection flow test
 * 
 * SIMPLIFIED MODEL (2024):
 * - One person per RSVP (no party members)
 * - Duplicate detection is based on primary person only
 */
test('duplicate prompt flow: shows existing suggestion and can create anyway', async ({ page, request }) => {
  // Reset rate limits before test
  await request.post(`${base}/api/admin/reset-rate-limits`, { data: { password: process.env.ADMIN_PASSWORD || 'metteogsigve', all: true } });

  // ensure a fresh test RSVP exists via API (no party array)
  const ts = Date.now();
  const rnd = Math.random().toString(36).slice(2,8);
  const primary = { firstName: 'Test', lastName: `Dup${ts}-${rnd}`, email: `dup+${ts}-${rnd}@example.com`, attending: true };
  const deviceId = `playwright-dup-${ts}-${rnd}`;
  const createRes = await request.post(`${base}/api/rsvp`, { data: primary, headers: { 'x-device-id': deviceId } });
  if (!createRes.ok()) { const txt = await createRes.text(); console.error('Create RSVP failed:', createRes.status(), txt); }
  expect(createRes.ok()).toBeTruthy();

  // Now navigate to the site and attempt a fuzzy duplicate
  await page.goto(`${base}/rsvp`);
  await page.getByLabel('Fornavn').fill('Test');
  await page.getByLabel('Etternavn').fill(`Dup${ts}`);
  await page.locator('#email').fill(`dup+${ts}+2@example.com`);
  await page.getByRole('button', { name: 'Send svar' }).click();

  // Wait for the duplicate prompt UI - Norwegian text
  await expect(page.locator('text=Eksisterende svar funnet')).toBeVisible();

  // Click create new anyway and wait for confirmation (Norwegian button)
  await page.click('button:has-text("Opprett nytt likevel")');
  // Wait for success confirmation - "Takk!" is the success heading
  await expect(page.locator('text=Svaret ditt er sendt')).toBeVisible();
});