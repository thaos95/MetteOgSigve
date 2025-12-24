const path = require('path');
const dotenv = require('dotenv');
// Load .env.local relative to this script (handles being run from repo root)
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
const fs = require('fs');
const { Client } = require('pg');
(async ()=>{
  try {
    const path = require('path');
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

    // Find all .sql files in migrations and apply them in lexicographic order.
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    const client = new Client(clientOptions);
    await client.connect();
    console.log('Connected, found migrations:', files);

    for (const file of files) {
      const migrationPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(migrationPath, 'utf8');
      console.log('Applying migration:', file);
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
        console.log('Applied:', file);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error('Failed to apply migration', file, err);
        throw err;
      }
    }

    await client.end();
    console.log('All migrations applied successfully.');
  } catch (e) {
    console.error('Migration failed:', e);
    process.exit(1);
  }
})();