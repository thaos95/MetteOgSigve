import { NextResponse } from "next/server";
import { Client } from "pg";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const password = body?.password;
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const connectionString = process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL_NON_POOLING;
    if (!connectionString) {
      return NextResponse.json({ error: "POSTGRES_URL not configured" }, { status: 500 });
    }

    const client = new Client({ connectionString });
    await client.connect();

    // Quick check: does table already exist?
    const check = await client.query("SELECT to_regclass('public.rsvps') as reg");
    if (check.rows?.[0]?.reg) {
      await client.end();
      return NextResponse.json({ ok: true, message: "Table 'rsvps' already exists" });
    }

    const sql = `
      create extension if not exists pgcrypto;

      create table if not exists public.rsvps (
        id uuid primary key default gen_random_uuid(),
        name text not null,
        email text,
        attending boolean,
        guests int default 0,
        notes text,
        created_at timestamptz default now()
      );

      alter table public.rsvps enable row level security;
    `;

    await client.query(sql);
    await client.end();

    return NextResponse.json({ ok: true, message: "Table 'rsvps' created and RLS enabled" });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
