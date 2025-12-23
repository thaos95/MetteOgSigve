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

    // 1) Exact email match (strong indicator)
    if (email) {
      const res = await supabaseServer.from('rsvps').select('id,name,email').eq('email', email).limit(1);
      if (res.error) return NextResponse.json({ error: res.error.message }, { status: 500 });
      if (res.data && res.data.length > 0) return NextResponse.json({ error: 'An RSVP with this email already exists' }, { status: 409 });
    }

    // 2) If name has at least first and last token, require both tokens to appear in an existing name (stricter)
    if (nameParts.length > 1) {
      const first = escapeLike(nameParts[0]);
      const last = escapeLike(nameParts[nameParts.length - 1]);
      // check for a record where name contains both tokens
      const both = await supabaseServer
        .from('rsvps')
        .select('id,name,email')
        .ilike('name', `%${first}%`)
        .ilike('name', `%${last}%`)
        .limit(1);
      if (both.error) return NextResponse.json({ error: both.error.message }, { status: 500 });
      if (both.data && both.data.length > 0) return NextResponse.json({ error: 'An RSVP with this name appears to exist' }, { status: 409 });
    } else if (nameParts.length === 1) {
      // fallback: single token match (first or surname)
      const token = escapeLike(nameParts[0]);
      const tokenRes = await supabaseServer.from('rsvps').select('id,name,email').ilike('name', `%${token}%`).limit(1);
      if (tokenRes.error) return NextResponse.json({ error: tokenRes.error.message }, { status: 500 });
      if (tokenRes.data && tokenRes.data.length > 0) return NextResponse.json({ error: 'An RSVP with this name appears to exist' }, { status: 409 });
    }

    // 3) Also check for exact (case-insensitive) name match as final guard
    const exact = await supabaseServer.from('rsvps').select('id,name,email').ilike('name', name).limit(1);
    if (exact.error) return NextResponse.json({ error: exact.error.message }, { status: 500 });
    if (exact.data && exact.data.length > 0) return NextResponse.json({ error: 'An RSVP with this name already exists' }, { status: 409 });

    const { error } = await supabaseServer.from("rsvps").insert({ name, email, attending, guests, notes });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}