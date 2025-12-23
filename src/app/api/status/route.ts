import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

export async function GET() {
  const urlPresent = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const roleKeyPresent = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!urlPresent || !roleKeyPresent) {
    return NextResponse.json({ ok: false, env: { urlPresent, roleKeyPresent } }, { status: 400 });
  }

  try {
    const { data, count, error } = await supabaseServer
      .from("rsvps")
      .select("id", { count: "exact", head: false });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, rsvpsCount: count ?? null });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
