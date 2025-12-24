const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
const { Client } = require('pg');
(async ()=>{
  try {
    const conn = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL;
    if (!conn) { console.error('No POSTGRES_URL found in env'); process.exit(1); }
    const clientOptions = { connectionString: conn };
    if (process.env.MIGRATION_SKIP_SSL_VERIFY === 'true') {
      clientOptions.ssl = { rejectUnauthorized: false };
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      console.warn('MIGRATION_SKIP_SSL_VERIFY=true: SSL verification disabled for schema check (NODE_TLS_REJECT_UNAUTHORIZED=0).');
    }
    const client = new Client(clientOptions);
    await client.connect();
    const cols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='rsvps';");
    console.log('Columns on rsvps:');
    for (const r of cols.rows) console.log('-', r.column_name, r.data_type);
    const sample = await client.query("SELECT id, name, first_name, last_name, party, email FROM rsvps ORDER BY created_at DESC LIMIT 5");
    console.log('\nSample rows:');
    for (const r of sample.rows) console.log(r);
    await client.end();
  } catch (e) { console.error('Check failed', e); process.exit(1); }
})();