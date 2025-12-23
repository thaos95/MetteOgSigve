import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

export async function POST(req: Request) {
  const body = await req.json();
  const { name, email, attending, guests, notes } = body;

  const { error } = await supabaseServer.from("rsvps").insert({ name, email, attending, guests, notes });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}