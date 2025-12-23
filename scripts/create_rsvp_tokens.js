// Run with: node scripts/create_rsvp_tokens.js
require('dotenv').config();
const { Client } = require('pg');
(async () => {
  try {
    const connectionString = process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL_NON_POOLING;
    if (!connectionString) throw new Error('POSTGRES_URL not found in env');
    // allow self-signed TLS for local dev; safe here because we're connecting to Supabase which requires TLS
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    const sql = `
      alter table public.rsvps add column if not exists cancelled boolean default false;
      alter table public.rsvps add column if not exists updated_at timestamptz;

      create table if not exists public.rsvp_tokens (
        id uuid primary key default gen_random_uuid(),
        rsvp_id uuid references public.rsvps(id) on delete cascade,
        token text not null unique,
        purpose text not null,
        used boolean default false,
        expires_at timestamptz,
        created_at timestamptz default now()
      );
    `;
    await client.query(sql);
    console.log('Alter/created rsvps and rsvp_tokens table');
    await client.end();
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
})();