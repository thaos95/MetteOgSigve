import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabaseServer';
import { logAdminAction } from '../../../../lib/adminAudit';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const password = body?.password;
    if (!password || password !== process.env.ADMIN_PASSWORD) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { rsvpId, action } = body as any;
    if (!rsvpId) return NextResponse.json({ error: 'rsvpId required' }, { status: 400 });
    if (!action) return NextResponse.json({ error: 'action required' }, { status: 400 });

    const { data: rows, error: fetchErr } = await supabaseServer.from('rsvps').select('*').eq('id', rsvpId).limit(1);
    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    const r = rows?.[0];
    if (!r) return NextResponse.json({ error: 'rsvp not found' }, { status: 404 });

    let party: any[] = [];
    try { if (Array.isArray(r.party)) party = r.party; else if (r.party && typeof r.party === 'string') party = JSON.parse(r.party); } catch(e) { party = []; }

    if (action === 'add') {
      const before = { party: JSON.parse(JSON.stringify(party)) };
      const p = { firstName: String(body.firstName || '').trim(), lastName: String(body.lastName || '').trim(), attending: !!body.attending };
      party.push(p);
      const { error: upErr } = await supabaseServer.from('rsvps').update({ party, updated_at: new Date().toISOString() }).eq('id', rsvpId);
      if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
      const { data: updated } = await supabaseServer.from('rsvps').select('*').eq('id', rsvpId).limit(1);
      const adminEmail = process.env.ADMIN_EMAIL || 'admin';
      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null;
      const deviceId = req.headers.get('x-device-id') || null;
      await logAdminAction({ adminEmail, action: 'add-guest', targetTable: 'rsvps', targetId: String(rsvpId), before, after: updated?.[0], ip, deviceId });
    } else if (action === 'update') {
      const idx = Number.isFinite(Number(body.index)) ? Number(body.index) : null;
      if (idx === null || idx < 0 || idx >= party.length) return NextResponse.json({ error: 'invalid index' }, { status: 400 });
      const before = { party: JSON.parse(JSON.stringify(party)) };
      party[idx] = { ...party[idx], firstName: String(body.firstName || party[idx].firstName || '').trim(), lastName: String(body.lastName || party[idx].lastName || '').trim(), attending: body.attending !== undefined ? !!body.attending : party[idx].attending };
      const { error: upErr } = await supabaseServer.from('rsvps').update({ party, updated_at: new Date().toISOString() }).eq('id', rsvpId);
      if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
      const { data: updated } = await supabaseServer.from('rsvps').select('*').eq('id', rsvpId).limit(1);
      const adminEmail = process.env.ADMIN_EMAIL || 'admin';
      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null;
      const deviceId = req.headers.get('x-device-id') || null;
      await logAdminAction({ adminEmail, action: 'update-guest', targetTable: 'rsvps', targetId: String(rsvpId), before, after: updated?.[0], ip, deviceId });
    } else if (action === 'remove') {
      const idx = Number.isFinite(Number(body.index)) ? Number(body.index) : null;
      if (idx === null || idx < 0 || idx >= party.length) return NextResponse.json({ error: 'invalid index' }, { status: 400 });
      const before = { party: JSON.parse(JSON.stringify(party)) };
      party.splice(idx, 1);
      const { error: upErr } = await supabaseServer.from('rsvps').update({ party, updated_at: new Date().toISOString() }).eq('id', rsvpId);
      if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
      const { data: updated } = await supabaseServer.from('rsvps').select('*').eq('id', rsvpId).limit(1);
      const adminEmail = process.env.ADMIN_EMAIL || 'admin';
      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null;
      const deviceId = req.headers.get('x-device-id') || null;
      await logAdminAction({ adminEmail, action: 'remove-guest', targetTable: 'rsvps', targetId: String(rsvpId), before, after: updated?.[0], ip, deviceId });
    } else if (action === 'move') {
      const idx = Number.isFinite(Number(body.index)) ? Number(body.index) : null;
      const dir = body.dir === 'up' ? -1 : body.dir === 'down' ? 1 : 0;
      if (idx === null || idx < 0 || idx >= party.length || dir === 0) return NextResponse.json({ error: 'invalid move parameters' }, { status: 400 });
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= party.length) return NextResponse.json({ error: 'out of bounds' }, { status: 400 });
      const before = { party: JSON.parse(JSON.stringify(party)) };
      const item = party.splice(idx, 1)[0];
      party.splice(newIdx, 0, item);
      const { error: upErr } = await supabaseServer.from('rsvps').update({ party, updated_at: new Date().toISOString() }).eq('id', rsvpId);
      if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
      const { data: updated } = await supabaseServer.from('rsvps').select('*').eq('id', rsvpId).limit(1);
      const adminEmail = process.env.ADMIN_EMAIL || 'admin';
      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null;
      const deviceId = req.headers.get('x-device-id') || null;
      await logAdminAction({ adminEmail, action: 'move-guest', targetTable: 'rsvps', targetId: String(rsvpId), before, after: updated?.[0], ip, deviceId });
    } else {
      return NextResponse.json({ error: 'unknown action' }, { status: 400 });
    }

    const { data: updated } = await supabaseServer.from('rsvps').select('*').eq('id', rsvpId).limit(1);
    return NextResponse.json({ ok: true, rsvp: updated?.[0] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}
