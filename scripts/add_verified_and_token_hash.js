// Run with: node scripts/add_verified_and_token_hash.js
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
(async () => {
  try {
    const connectionString = process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL_NON_POOLING;
    if (!connectionString) throw new Error('POSTGRES_URL not found in env');
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();

    const sql = `
      alter table public.rsvps add column if not exists verified boolean default false;

      alter table public.rsvp_tokens add column if not exists token_hash text;
      alter table public.rsvp_tokens alter column token drop not null;
      create index if not exists rsvp_tokens_token_hash_idx on public.rsvp_tokens (token_hash);
    `;

    await client.query(sql);
    console.log('Applied verified + token_hash migration');
    await client.end();
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
})();