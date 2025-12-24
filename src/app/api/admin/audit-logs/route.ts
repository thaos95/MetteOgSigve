import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabaseServer';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const password = url.searchParams.get('password');
    if (!password || password !== process.env.ADMIN_PASSWORD) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const limit = Math.min(Number(url.searchParams.get('limit') || 50), 200);
    const offset = Math.max(Number(url.searchParams.get('offset') || 0), 0);
    const adminEmail = url.searchParams.get('adminEmail');
    const action = url.searchParams.get('action');
    const targetTable = url.searchParams.get('targetTable');
    const targetId = url.searchParams.get('targetId');

    let q = supabaseServer.from('admin_audit_logs').select('*').order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    if (adminEmail) q = q.eq('admin_email', adminEmail);
    if (action) q = q.eq('action', action);
    if (targetTable) q = q.eq('target_table', targetTable);
    if (targetId) q = q.eq('target_id', targetId);

    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Parse before/after fields if they're strings
    const parsed = (data || []).map((row: any) => ({
      ...row,
      before: tryParseJson(row.before),
      after: tryParseJson(row.after),
    }));

    return NextResponse.json({ ok: true, logs: parsed });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}

function tryParseJson(v: any) {
  if (!v) return v;
  if (typeof v === 'object') return v;
  try { return JSON.parse(v); } catch(e) { return v; }
}
