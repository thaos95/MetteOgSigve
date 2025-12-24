require('dotenv').config({ path: '.env.local' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');
(async ()=>{
  try {
    const connectionString = process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL_NON_POOLING;
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    const email = process.env.TEST_EMAIL_PERSIST || `integration-test+${Date.now()}@example.com`;
    const name = 'Integration Test RSVP';
    const attending = false;
    const guests = 0;
    const notes = 'persistent rsvp for rate-limit testing';
    const res = await client.query('INSERT INTO public.rsvps (name, email, attending, guests, notes, verified, created_at) VALUES ($1,$2,$3,$4,$5,$6,now()) RETURNING id, email', [name, email, attending, guests, notes, true]);
    console.log('Inserted RSVP', res.rows[0]);
    await client.end();
  } catch (e) { console.error(e); process.exit(1); }
})();