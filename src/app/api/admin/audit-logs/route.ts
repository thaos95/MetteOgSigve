import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabaseServer';

// POST method for secure password handling (not exposed in URL/logs)
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const password = body?.password;
    if (!password || password !== process.env.ADMIN_PASSWORD) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const limit = Math.min(Number(body?.limit || 50), 200);
    const offset = Math.max(Number(body?.offset || 0), 0);
    const adminEmail = body?.adminEmail;
    const action = body?.action;
    const targetTable = body?.targetTable;
    const targetId = body?.targetId;

    // Use exact count to support client pagination
    let q = supabaseServer.from('admin_audit_logs').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    if (adminEmail) q = q.eq('admin_email', adminEmail);
    if (action) q = q.eq('action', action);
    if (targetTable) q = q.eq('target_table', targetTable);
    if (targetId) q = q.eq('target_id', targetId);

    const { data, error, count } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Parse before/after fields if they're strings
    const parsed = (data || []).map((row: any) => ({
      ...row,
      before: tryParseJson(row.before),
      after: tryParseJson(row.after),
    }));

    return NextResponse.json({ ok: true, logs: parsed, count: typeof count === 'number' ? count : parsed.length });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}

function tryParseJson(v: any) {
  if (!v) return v;
  if (typeof v === 'object') return v;
  try { return JSON.parse(v); } catch(e) { return v; }
}
