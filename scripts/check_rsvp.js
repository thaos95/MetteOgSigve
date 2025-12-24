require('dotenv').config({ path: '.env.local' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');
(async ()=>{
  try {
    const connectionString = process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL_NON_POOLING;
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    const res = await client.query('select id,email,verified from public.rsvps where email=$1 limit 5', ['integration-test+1766537124557@example.com']);
    console.log(res.rows);
    await client.end();
  } catch (e) { console.error(e); process.exit(1); }
})();