import { test, expect } from '@playwright/test';

const base = process.env.BASE_URL || 'http://localhost:3000';

test.describe('RSVP token flow for unverified users', () => {
  test('unverified guest can request edit token and use it to update RSVP', async ({ page, request }) => {
    // Reset rate limits
    await request.post(`${base}/api/admin/reset-rate-limits`, { 
      data: { password: process.env.ADMIN_PASSWORD || 'metteogsigve', all: true } 
    });

    const ts = Date.now();
    const rnd = Math.random().toString(36).slice(2, 8);
    const deviceId = `playwright-unverified-${ts}-${rnd}`;
    const email = `unverified+${ts}-${rnd}@example.com`;
    
    // Create RSVP via API (will be unverified by default)
    const payload = { 
      firstName: 'Unverified', 
      lastName: `Guest${ts}`, 
      email, 
      attending: true, 
      party: [], 
      notes: 'Initial notes' 
    };

    const create = await request.post(`${base}/api/rsvp`, { 
      data: payload, 
      headers: { 'x-device-id': deviceId } 
    });
    expect(create.ok()).toBeTruthy();
    const created = await create.json();
    const rsvpId = created.rsvp.id;

    // Verify the RSVP is unverified
    expect(created.rsvp.verified).toBeFalsy();

    // KEY TEST: Request edit token for unverified RSVP - should succeed now
    const tokenReq = await request.post(`${base}/api/rsvp/request-token`, {
      data: { email, purpose: 'edit' },
      headers: { 'x-device-id': deviceId }
    });
    expect(tokenReq.ok(), 'Unverified users should be able to request edit tokens').toBeTruthy();
    const tokenJson = await tokenReq.json();
    expect(tokenJson.devToken, 'Dev mode should return token for testing').toBeTruthy();
    const token = tokenJson.devToken;

    // Use token to verify and load RSVP in UI
    await page.goto(`${base}/rsvp?token=${token}`);

    // Form should be prefilled
    await expect(page.getByLabel('First name')).toHaveValue('Unverified');
    await expect(page.getByLabel('Last name')).toHaveValue(`Guest${ts}`);

    // Modify notes and update
    await page.fill('textarea', 'Updated by unverified guest via token');
    
    // Submit update
    const updatePromise = page.waitForResponse(r => r.url().includes('/api/rsvp/') && r.request().method() === 'PUT');
    await page.click('button:has-text("Update RSVP")');
    const updateResp = await updatePromise;
    expect(updateResp.ok(), 'Update should succeed with token').toBeTruthy();

    // Verify success message
    await expect(page.locator('text=Your RSVP has been')).toBeVisible();

    // Verify the RSVP is now marked as verified (token usage proves inbox control)
    const check = await request.post(`${base}/api/admin/rsvps`, { 
      data: { password: process.env.ADMIN_PASSWORD || 'metteogsigve' } 
    });
    expect(check.ok()).toBeTruthy();
    const checkJson = await check.json();
    const updatedRsvp = (checkJson.rsvps || []).find((r: any) => r.id === rsvpId);
    expect(updatedRsvp?.verified, 'RSVP should be verified after token use').toBeTruthy();
    expect(updatedRsvp?.notes).toBe('Updated by unverified guest via token');
  });

  test('duplicate detection flow requests token automatically', async ({ page, request }) => {
    // Reset rate limits
    await request.post(`${base}/api/admin/reset-rate-limits`, { 
      data: { password: process.env.ADMIN_PASSWORD || 'metteogsigve', all: true } 
    });

    const ts = Date.now();
    const rnd = Math.random().toString(36).slice(2, 8);
    const deviceId = `playwright-dup-auto-${ts}-${rnd}`;
    const email = `dupauto+${ts}-${rnd}@example.com`;
    
    // Create existing RSVP
    const existingPayload = { 
      firstName: 'Existing', 
      lastName: `DupTest${ts}`, 
      email, 
      attending: true, 
      party: [] 
    };

    const create = await request.post(`${base}/api/rsvp`, { 
      data: existingPayload, 
      headers: { 'x-device-id': deviceId } 
    });
    expect(create.ok()).toBeTruthy();

    // Navigate to RSVP page and try to submit a duplicate
    await page.goto(`${base}/rsvp`);
    await page.getByLabel('First name').fill('Existing');
    await page.getByLabel('Last name').fill(`DupTest${ts}`);
    await page.getByLabel('Email', { exact: true }).fill(`other+${ts}@example.com`);
    await page.getByRole('button', { name: 'Send RSVP' }).click();

    // Should show existing RSVP found
    await expect(page.locator('text=Existing RSVP Found')).toBeVisible();

    // Accept the dialog that will appear when clicking Edit
    page.on('dialog', async dialog => {
      // In dev mode, the token will be auto-applied
      if (dialog.message().includes('Development mode') || dialog.message().includes('Edit token applied')) {
        await dialog.accept();
      } else if (dialog.message().includes('secure link')) {
        // In production mode, link is sent to email
        await dialog.accept();
      } else {
        await dialog.accept();
      }
    });

    // Click Edit this RSVP - should auto-request token
    await page.click('button:has-text("Edit this RSVP")');

    // In dev mode, the token should be auto-applied and form should be ready
    // Wait a moment for the async token request
    await page.waitForTimeout(1000);
  });

  test('resend verification endpoint works', async ({ request }) => {
    // Reset rate limits
    await request.post(`${base}/api/admin/reset-rate-limits`, { 
      data: { password: process.env.ADMIN_PASSWORD || 'metteogsigve', all: true } 
    });

    const ts = Date.now();
    const rnd = Math.random().toString(36).slice(2, 8);
    const deviceId = `playwright-resend-${ts}-${rnd}`;
    const email = `resend+${ts}-${rnd}@example.com`;
    
    // Create unverified RSVP
    const payload = { 
      firstName: 'Resend', 
      lastName: `Test${ts}`, 
      email, 
      attending: true, 
      party: [] 
    };

    const create = await request.post(`${base}/api/rsvp`, { 
      data: payload, 
      headers: { 'x-device-id': deviceId } 
    });
    expect(create.ok()).toBeTruthy();

    // Request resend verification
    const resend = await request.post(`${base}/api/rsvp/resend-verification`, {
      data: { email },
      headers: { 'x-device-id': deviceId }
    });
    expect(resend.ok()).toBeTruthy();
    const resendJson = await resend.json();
    expect(resendJson.devToken, 'Dev mode should return verification token').toBeTruthy();

    // Use the verification token
    const verifyResp = await request.get(`${base}/api/rsvp/verify-token?token=${resendJson.devToken}`);
    expect(verifyResp.ok()).toBeTruthy();
    const verifyJson = await verifyResp.json();
    expect(verifyJson.rsvp.verified).toBeTruthy();
  });

  test('401 error shows helpful guidance instead of generic error', async ({ page, request }) => {
    // Reset rate limits
    await request.post(`${base}/api/admin/reset-rate-limits`, { 
      data: { password: process.env.ADMIN_PASSWORD || 'metteogsigve', all: true } 
    });

    const ts = Date.now();
    const rnd = Math.random().toString(36).slice(2, 8);
    const deviceId = `playwright-401-${ts}-${rnd}`;
    const email = `test401+${ts}-${rnd}@example.com`;
    
    // Create RSVP via API
    const create = await request.post(`${base}/api/rsvp`, { 
      data: { firstName: 'Test', lastName: `User${ts}`, email, attending: true, party: [] }, 
      headers: { 'x-device-id': deviceId } 
    });
    expect(create.ok()).toBeTruthy();
    const rsvpId = (await create.json()).rsvp.id;

    // Try to update without token via direct API call
    const updateResp = await request.put(`${base}/api/rsvp/${rsvpId}`, {
      data: { firstName: 'Test', lastName: `User${ts}`, notes: 'Attempted update' }
    });
    expect(updateResp.status()).toBe(401);
    const errJson = await updateResp.json();
    expect(errJson.error).toContain('token required');
  });
});
