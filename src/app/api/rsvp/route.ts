import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

function isValidEmail(email?: string) {
  if (!email) return true;
  const re = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  return re.test(email);
}

function normalizeName(n: string) {
  return n
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeLike(s: string) {
  return s.replace(/([%_\\])/g, "\\$1");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = (body.name ?? "").toString().trim();
    const email = body.email ? String(body.email).trim().toLowerCase() : null;
    const attending = !!body.attending;
    const guests = Number.isFinite(Number(body.guests)) ? Number(body.guests) : 0;
    const notes = body.notes ? String(body.notes).trim() : null;

    // Basic validation
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (name.length > 200) return NextResponse.json({ error: "Name too long" }, { status: 400 });
    if (email && !isValidEmail(email)) return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    if (guests < 0 || guests > 20) return NextResponse.json({ error: "Guests must be between 0 and 20" }, { status: 400 });
    if (notes && notes.length > 1000) return NextResponse.json({ error: "Notes too long" }, { status: 400 });

    // Stricter duplicate heuristics
    const normName = normalizeName(name);
    const nameParts = normName.split(' ').filter(Boolean);
    const checks: any[] = [];

    if (email) {
      // exact email match
      checks.push({ type: 'email', query: supabaseServer.from('rsvps').select('id,name,email').eq('email', email).limit(1) });
    }

    // exact case-insensitive name match
    checks.push({ type: 'name_exact', query: supabaseServer.from('rsvps').select('id,name,email').ilike('name', name) });

    // partial token matches (first and last name)
    if (nameParts.length) {
      const first = escapeLike(nameParts[0]);
      checks.push({ type: 'first', query: supabaseServer.from('rsvps').select('id,name,email').ilike('name', `%${first}%`).limit(1) });
      if (nameParts.length > 1) {
        const last = escapeLike(nameParts[nameParts.length - 1]);
        checks.push({ type: 'last', query: supabaseServer.from('rsvps').select('id,name,email').ilike('name', `%${last}%`).limit(1) });
      }
    }

    for (const c of checks) {
      const res = await c.query;
      if (res.error) return NextResponse.json({ error: res.error.message }, { status: 500 });
      if (res.data && res.data.length > 0) {
        return NextResponse.json({ error: 'An RSVP with this name or email appears to exist' }, { status: 409 });
      }
    }

    const { error } = await supabaseServer.from("rsvps").insert({ name, email, attending, guests, notes });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}