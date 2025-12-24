import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabaseServer';
import { logAdminAction } from '../../../../lib/adminAudit';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { password, confirm } = body as { password?: string; confirm?: string };
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    // require explicit confirmation token to avoid accidental deletes
    if (!confirm || confirm !== 'DELETE') {
      return NextResponse.json({ error: 'confirmation required. send { confirm: "DELETE" }' }, { status: 400 });
    }

    // fetch ids then delete (Safer to avoid accidental "delete all" API mis-use in some clients)
    const { data: rows, error: selErr } = await supabaseServer.from('rsvps').select('id');
    if (selErr) return NextResponse.json({ error: selErr.message }, { status: 500 });
    const ids = (rows ?? []).map((r: any) => r.id).filter(Boolean);
    if (ids.length === 0) return NextResponse.json({ ok: true, deleted: 0 });

    const { error: delErr } = await supabaseServer.from('rsvps').delete().in('id', ids);
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

    // Audit log for destructive operation
    const adminEmail = process.env.ADMIN_EMAIL || 'admin';
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null;
    const deviceId = req.headers.get('x-device-id') || null;
    await logAdminAction({ adminEmail, action: 'clear-all-rsvps', targetTable: 'rsvps', targetId: 'ALL', before: { count: ids.length, ids }, after: null, ip, deviceId });

    return NextResponse.json({ ok: true, deleted: ids.length });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}
