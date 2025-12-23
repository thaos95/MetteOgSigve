require('dotenv').config({ path: '.env.local' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');
const now = ()=>new Date().toISOString();
const log = (...args)=>console.log('[get_rsvp]', now(), ...args);
(async ()=>{
  try {
    const client = new Client({ connectionString: process.env.POSTGRES_URL, ssl: { rejectUnauthorized: false } });
    await client.connect();
    const id = '4de9b192-a263-488f-9970-d980359bb5f5';
    const res = await client.query('select id,name,email,notes,cancelled,updated_at from public.rsvps where id=$1', [id]);
    log(res.rows[0]);
    await client.end();
  } catch (err) { console.error('[get_rsvp]', now(), err); process.exit(1); }
})();