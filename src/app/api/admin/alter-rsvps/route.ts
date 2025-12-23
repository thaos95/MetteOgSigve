import { NextResponse } from "next/server";
import { Client } from "pg";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const password = body?.password;
    if (!password || password !== process.env.ADMIN_PASSWORD) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const connectionString = process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL_NON_POOLING;
    if (!connectionString) return NextResponse.json({ error: 'POSTGRES_URL not configured' }, { status: 500 });

    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();

    // Idempotent: add columns if not exist
    const sql = `
      -- RSVPs: add cancelled/updated_at and a verified flag
      alter table public.rsvps add column if not exists cancelled boolean default false;
      alter table public.rsvps add column if not exists updated_at timestamptz;
      alter table public.rsvps add column if not exists verified boolean default false;

      -- rsvp_tokens: create table if not exists and add token_hash for secure storage
      create table if not exists public.rsvp_tokens (
        id uuid primary key default gen_random_uuid(),
        rsvp_id uuid references public.rsvps(id) on delete cascade,
        token text unique,
        token_hash text,
        purpose text not null,
        used boolean default false,
        expires_at timestamptz,
        created_at timestamptz default now()
      );

      -- Make token nullable for backward compatibility (drop NOT NULL if it exists)
      alter table public.rsvp_tokens alter column token drop not null;

      -- Index for quick lookup by token_hash
      create index if not exists rsvp_tokens_token_hash_idx on public.rsvp_tokens (token_hash);
    `;

    await client.query(sql);
    await client.end();
    return NextResponse.json({ ok: true, message: 'Altered rsvps table (cancelled, updated_at) if not present' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}