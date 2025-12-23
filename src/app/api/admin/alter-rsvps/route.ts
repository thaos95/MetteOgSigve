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
      alter table public.rsvps add column if not exists cancelled boolean default false;
      alter table public.rsvps add column if not exists updated_at timestamptz;
    `;

    await client.query(sql);
    await client.end();
    return NextResponse.json({ ok: true, message: 'Altered rsvps table (cancelled, updated_at) if not present' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}