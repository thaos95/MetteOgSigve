import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";

function csvEscape(value: any) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (s.includes('"') || s.includes(',') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const password = body?.password;
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // Apply optional filters: attending (all|yes|no), from/to dates (ISO)
    const attending = body?.attending; // 'all' | 'yes' | 'no'
    const from = body?.from; const to = body?.to;

    // By default only include verified RSVPs; allow admin to include unverified by setting include_unverified = true
    const includeUnverified = !!body?.include_unverified;
    let q = supabaseServer.from('rsvps').select('*');
    if (!includeUnverified) q = q.eq('verified', true);
    if (attending === 'yes') q = q.eq('attending', true);
    if (attending === 'no') q = q.eq('attending', false);
    if (from) q = q.gte('created_at', from);
    if (to) q = q.lte('created_at', to);
    q = q.order('created_at', { ascending: false });

    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const rows = data ?? [];
    const headers = ['id','name','email','attending','guests','notes','created_at'];
    const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => csvEscape(r[h])).join(','))).join('\n');

    const res = new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="rsvps.csv"'
      }
    });

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
