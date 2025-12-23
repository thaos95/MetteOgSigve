import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const password = body?.password;
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabaseServer.from("rsvps").select("*").order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ rsvps: data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}

// NOTE: This is more secure than accepting a password via query string since it
// avoids storing secrets in server logs or browser history. For production use,
// consider proper auth (Supabase Auth / Magic Link / OAuth) or platform-level protection.