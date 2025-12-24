import { test, expect } from '@playwright/test';

const base = process.env.BASE_URL || 'http://localhost:3000';

test('token paste/use flow: generate token, apply it, and update RSVP', async ({ page, request }) => {
  const ts = Date.now();
  const deviceId = `playwright-token-${ts}`;
  const email = `token+${ts}@example.com`;
  const payload = { firstName: 'Token', lastName: `User${ts}`, email, attending: true, party: [], notes: 'Initial notes' };

  const create = await request.post(`${base}/api/rsvp`, { data: payload, headers: { 'x-device-id': deviceId } });
  expect(create.ok()).toBeTruthy();
  const created = await create.json();
  const rsvpId = created.rsvp.id;

  // generate a dev test token
  const gen = await request.post(`${base}/api/rsvp/generate-test-token`, { data: { email } });
  if (!gen.ok()) {
    const txt = await gen.text();
    console.error('Generate test token failed:', gen.status(), txt);
  }
  expect(gen.ok()).toBeTruthy();
  const genJson = await gen.json();
  expect(genJson.token).toBeTruthy();
  const token = genJson.token;

  // Visit RSVP page and paste token, then use it
  await page.goto(`${base}/rsvp`);
  await page.fill('input[placeholder="Paste token here"]', token);
  await page.click('button:has-text("Use token")');

  // form should be populated with returned RSVP info
  await expect(page.getByLabel('First name')).toHaveValue('Token');
  await expect(page.getByLabel('Last name')).toHaveValue(`User${ts}`);
  // use exact label match to avoid matching other labels that contain 'email'
  await expect(page.getByLabel('Email', { exact: true })).toHaveValue(email);

  // modify a field and submit update
  await page.fill('textarea', 'Updated via E2E');
  // wait for the PUT /api/rsvp/:id response and verify success
  const putRespPromise = page.waitForResponse(r => r.url().includes('/api/rsvp/') && r.request().method() === 'PUT');
  await page.click('button:has-text("Update RSVP")');
  const putResp = await putRespPromise;
  expect(putResp.ok()).toBeTruthy();
  const putJson = await putResp.json();
  expect(putJson.ok).toBeTruthy();
  expect(putJson.rsvp).toBeTruthy();
  expect(putJson.rsvp.notes).toContain('Updated via E2E');

  // verify via admin rsvps API that the rsvp was updated
  const listRes = await request.post(`${base}/api/admin/rsvps`, { data: { password: process.env.ADMIN_PASSWORD || 'metteogsigve' } });
  expect(listRes.ok()).toBeTruthy();
  const listJson = await listRes.json();
  const found = (listJson.rsvps || []).find((r:any) => r.id === rsvpId);
  expect(found).toBeTruthy();
  expect(found.notes).toContain('Updated via E2E');
});

test('request-token to alternate email with updateEmail updates RSVP and returns token', async ({ request }) => {
  const ts = Date.now();
  const email = `change+${ts}@example.com`;
  const alt = `alt+${ts}@example.com`;
  const payload = { firstName: 'Change', lastName: `Email${ts}`, email, attending: false };
  const deviceId = `playwright-token-${ts}`;

  const create = await request.post(`${base}/api/rsvp`, { data: payload, headers: { 'x-device-id': deviceId } });
  if (!create.ok()) {
    const txt = await create.text();
    console.error('Create RSVP failed:', create.status(), txt);
  }
  expect(create.ok()).toBeTruthy();
  const created = await create.json();
  const rsvpId = created.rsvp.id;

  // request token to alternate email and ask to update RSVP email
  const req = await request.post(`${base}/api/rsvp/request-token`, { data: { email, purpose: 'edit', sendToEmail: alt, updateEmail: true }, headers: { 'x-device-id': deviceId } });
  if (!req.ok()) {
    const txt = await req.text();
    console.error('Request-token failed:', req.status(), txt);
  }
  expect(req.ok()).toBeTruthy();
  const json = await req.json();
  // in dev mode we get devToken back
  expect(json.devToken || json.ok).toBeTruthy();
  const devToken = json.devToken;

  // Confirm RSVP email was updated by hitting admin rsvps
  const listRes = await request.post(`${base}/api/admin/rsvps`, { data: { password: process.env.ADMIN_PASSWORD || 'metteogsigve' } });
  expect(listRes.ok()).toBeTruthy();
  const listJson = await listRes.json();
  const found = (listJson.rsvps || []).find((r:any) => r.id === rsvpId);
  expect(found).toBeTruthy();
  expect(found.email).toBe(alt);
  // verify token works when verifying (if dev token present)
  if (devToken) {
    const verify = await request.get(`${base}/api/rsvp/verify-token?token=${encodeURIComponent(devToken)}`);
    expect(verify.ok()).toBeTruthy();
    const vj = await verify.json();
    expect(vj.ok).toBeTruthy();
    expect(vj.rsvp).toBeTruthy();
    expect(vj.rsvp.id).toBe(rsvpId);
  }
});