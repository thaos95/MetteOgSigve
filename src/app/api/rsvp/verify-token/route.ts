import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabaseServer';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 });

    // hash incoming token and lookup by token_hash
    const crypto = await import('crypto');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const { data, error } = await supabaseServer.from('rsvp_tokens').select('*, rsvps(*)').eq('token_hash', tokenHash).limit(1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const row = data?.[0];
    if (!row) return NextResponse.json({ error: 'Invalid token' }, { status: 404 });

    const now = new Date();
    if (row.expires_at && new Date(row.expires_at) < now) return NextResponse.json({ error: 'Token expired' }, { status: 410 });

    // mark token used and set RSVP verified=true
    const { error: tokenUpdateErr } = await supabaseServer.from('rsvp_tokens').update({ used: true }).eq('id', row.id);
    if (tokenUpdateErr) console.error('Could not mark token used', tokenUpdateErr);
    const { data: updatedRsvp, error: rsvpUpdateErr } = await supabaseServer.from('rsvps').update({ verified: true, updated_at: new Date().toISOString() }).eq('id', row.rsvp_id).select('*').limit(1);
    if (rsvpUpdateErr) console.error('Could not update rsvp verified', rsvpUpdateErr);

    return NextResponse.json({ ok: true, rsvp: updatedRsvp?.[0] ?? row.rsvps, purpose: row.purpose });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}