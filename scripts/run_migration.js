const path = require('path');
const dotenv = require('dotenv');
// Load .env.local relative to this script (handles being run from repo root)
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
const fs = require('fs');
const { Client } = require('pg');
(async ()=>{
  try {
    const path = require('path');
    const migrationPath = path.join(__dirname, 'migrations', '001-add-rsvp-party-columns.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    const conn = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL;
    if (!conn) { console.error('No POSTGRES_URL found in env (POSTGRES_URL_NON_POOLING / POSTGRES_PRISMA_URL / POSTGRES_URL).'); process.exit(1); }
    // Allow skipping SSL verification via env var (useful in dev or proxy environments).
    const clientOptions = { connectionString: conn };
    if (process.env.MIGRATION_SKIP_SSL_VERIFY === 'true') {
      clientOptions.ssl = { rejectUnauthorized: false };
      // Node's TLS stack can still reject some cert chains; allow full override if requested (insecure)
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      console.warn('MIGRATION_SKIP_SSL_VERIFY=true: SSL certificate verification is disabled for this migration run (NODE_TLS_REJECT_UNAUTHORIZED=0).');
    }
    const client = new Client(clientOptions);
    await client.connect();
    console.log('Connected, running migration...');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    await client.end();
    console.log('Migration applied successfully.');
  } catch (e) {
    console.error('Migration failed:', e);
    process.exit(1);
  }
})();