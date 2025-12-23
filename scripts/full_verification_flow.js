require('dotenv').config({ path: '.env.local' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');
const crypto = require('crypto');
const fetch = globalThis.fetch ? globalThis.fetch.bind(globalThis) : (...args) => import('node-fetch').then(({default:fetch})=>fetch(...args));
(async ()=>{
  try {
    const connectionString = process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL_NON_POOLING;
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();

    // 1) Create a fresh RSVP
    const name = 'Full Test';
    const email = process.env.TEST_RSVP_EMAIL || 'fulltest@example.com';
    await client.query('insert into public.rsvps(id,name,email,attending,guests,notes) values (gen_random_uuid(), $1, $2, true, 0, $3) ON CONFLICT DO NOTHING', [name, email, 'created by full flow test']);
    const r = (await client.query('select id,name,email,verified from public.rsvps where email=$1 limit 1', [email])).rows[0];
    console.log('Created RSVP:', r);

    // 2) Insert a verification token (print raw token)
    const token = crypto.randomBytes(20).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expires_at = new Date(Date.now()+1000*60*60).toISOString();
    await client.query('insert into public.rsvp_tokens(rsvp_id, token_hash, purpose, expires_at) values($1,$2,$3,$4)', [r.id, tokenHash, 'verify', expires_at]);
    console.log('Inserted verification token (raw):', token);

    // 3) Call verify-token endpoint
    const verifyRes = await fetch((process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000') + `/api/rsvp/verify-token?token=${token}`);
    const verifyJson = await verifyRes.json();
    console.log('verify-token response', verifyRes.status, verifyJson);

    // 4) Request an edit token via API (should now be allowed). Retry briefly if verification hasn't propagated yet.
    let requestRes;
    for (let i=0;i<6;i++){
      requestRes = await fetch((process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000') + '/api/rsvp/request-token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email, purpose: 'edit', recaptchaToken: 'test-token' }) });
      if (!requestRes) {
        await new Promise(r=>setTimeout(r, 500));
        continue;
      }
      if (requestRes.status === 200) break;
      await new Promise(r=>setTimeout(r, 500));
    }
    if (!requestRes) {
      console.error('request-token: no response received after retries');
      process.exit(1);
    }
    console.log('request-token response status', requestRes.status);
    // 5) Insert an edit token directly (since email sending may not work in dev) and use it to update
    const editToken = crypto.randomBytes(20).toString('hex');
    const editHash = crypto.createHash('sha256').update(editToken).digest('hex');
    await client.query('insert into public.rsvp_tokens(rsvp_id, token_hash, purpose, expires_at) values($1,$2,$3,$4)', [r.id, editHash, 'edit', expires_at]);
    console.log('Inserted edit token:', editToken);

    // 6) Use PUT endpoint to update via token
    const putRes = await fetch((process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000') + `/api/rsvp/${r.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Full Test Updated', token: editToken }) });
    const putJson = await putRes.json();
    console.log('PUT response', putRes.status, putJson);

    await client.end();
    process.exit(0);
  } catch (err) { console.error('Error:', err); process.exit(1); }
})();