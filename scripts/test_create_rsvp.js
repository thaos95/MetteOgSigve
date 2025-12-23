require('dotenv').config({ path: '.env.local' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const fetch = globalThis.fetch ? globalThis.fetch.bind(globalThis) : (...args) => import('node-fetch').then(({default:fetch})=>fetch(...args));
const { Client } = require('pg');
(async ()=>{
  try {
    const url = process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000';
    const email = `test+rsvp+${Date.now()}@example.com`;
    const body = { name: 'Test RSVP Script', email, attending: true, guests: 0, notes: 'created by test_create_rsvp.js', recaptchaToken: 'test-token' };
    const res = await fetch(url + '/api/rsvp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    let json = null;
    try { json = await res.json(); } catch(e){ /* ignore */ }
    console.log('POST /api/rsvp', res.status, json);

    if (res.status === 200) {
      // verify row in DB
      const connectionString = process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL_NON_POOLING;
      if (!connectionString) { console.warn('POSTGRES_URL not set; cannot verify DB row'); process.exit(0); }
      const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
      await client.connect();
      const r = await client.query('select id,name,email,verified,created_at from public.rsvps where email=$1 order by created_at desc limit 1', [email]);
      console.log('DB row:', r.rows[0]);

      // cleanup the test row
      await client.query('delete from public.rsvps where email=$1', [email]);
      console.log('Cleaned up test RSVP');
      await client.end();
    }

    process.exit(0);
  } catch (e) { console.error('Error:', e); process.exit(1); }
})();