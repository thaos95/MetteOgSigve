require('dotenv').config({ path: '.env.local' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const crypto = require('crypto');
const now = ()=>new Date().toISOString();
const log = (...args)=>console.log('[test_request_token]', now(), ...args);
(async ()=>{
  try {
    const connectionString = process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL_NON_POOLING;
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    const res = await client.query(`select id,name,email from public.rsvps limit 1`);
    if (!res.rows.length) throw new Error('no rsvps found');
    const r = res.rows[0];
    const token = crypto.randomBytes(20).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expires_at = new Date(Date.now()+1000*60*60).toISOString();
    await client.query('insert into public.rsvp_tokens(rsvp_id, token_hash, purpose, expires_at) values($1,$2,$3,$4)', [r.id, tokenHash, 'edit', expires_at]);
    log('Inserted token for', r.email, token);
    await client.end();
  } catch (err) { console.error('[test_request_token]', now(), err); process.exit(1); }
})();