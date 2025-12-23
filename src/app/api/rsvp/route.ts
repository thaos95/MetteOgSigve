import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

function isValidEmail(email?: string) {
  if (!email) return true;
  const re = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  return re.test(email);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = (body.name ?? "").toString().trim();
    const email = body.email ? String(body.email).trim() : null;
    const attending = !!body.attending;
    const guests = Number.isFinite(Number(body.guests)) ? Number(body.guests) : 0;
    const notes = body.notes ? String(body.notes).trim() : null;

    // Basic validation
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (name.length > 200) return NextResponse.json({ error: "Name too long" }, { status: 400 });
    if (email && !isValidEmail(email)) return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    if (guests < 0 || guests > 20) return NextResponse.json({ error: "Guests must be between 0 and 20" }, { status: 400 });
    if (notes && notes.length > 1000) return NextResponse.json({ error: "Notes too long" }, { status: 400 });

    // Duplicate check (by exact email or case-insensitive name)
    const duplicateCheck = await supabaseServer
      .from("rsvps")
      .select("id,name,email")
      .or(`email.eq.${email ?? ""},name.ilike.${name.replace(/%/g, "\\%")}`)
      .limit(1);

    if (duplicateCheck.error) {
      return NextResponse.json({ error: duplicateCheck.error.message }, { status: 500 });
    }

    if (duplicateCheck.data && duplicateCheck.data.length > 0) {
      return NextResponse.json({ error: "An RSVP with this name or email already exists" }, { status: 409 });
    }

    const { error } = await supabaseServer.from("rsvps").insert({ name, email, attending, guests, notes });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}