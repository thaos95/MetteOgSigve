import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabaseServer';
import { logAdminAction } from '../../../../lib/adminAudit';

/**
 * Admin Update Person Route
 * 
 * SIMPLIFIED MODEL (2024):
 * - One person per RSVP (no party members)
 * - Only toggles the primary person's attending status
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const password = body?.password;
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const rsvpId = body?.rsvpId;
    const attending = body?.attending;
    
    if (!rsvpId) {
      return NextResponse.json({ error: 'rsvpId required' }, { status: 400 });
    }
    if (attending === undefined) {
      return NextResponse.json({ error: 'attending required' }, { status: 400 });
    }

    const { data: rows, error: fetchErr } = await supabaseServer
      .from('rsvps')
      .select('*')
      .eq('id', rsvpId)
      .limit(1);
      
    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }
    
    const r = rows?.[0];
    if (!r) {
      return NextResponse.json({ error: 'rsvp not found' }, { status: 404 });
    }

    const before = r;
    
    const { error: upErr } = await supabaseServer
      .from('rsvps')
      .update({ attending: !!attending, updated_at: new Date().toISOString() })
      .eq('id', rsvpId);
      
    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }
    
    const { data: updated } = await supabaseServer
      .from('rsvps')
      .select('*')
      .eq('id', rsvpId)
      .limit(1);

    // Audit log
    const adminEmail = process.env.ADMIN_EMAIL || 'admin';
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null;
    const deviceId = req.headers.get('x-device-id') || null;
    await logAdminAction({ 
      adminEmail, 
      action: 'update-attending', 
      targetTable: 'rsvps', 
      targetId: String(rsvpId), 
      before, 
      after: updated?.[0], 
      ip, 
      deviceId 
    });

    return NextResponse.json({ ok: true, rsvp: updated?.[0] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}
