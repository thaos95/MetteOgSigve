import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabaseServer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, email, adminPassword } = body || {};

    // only allow in development or with adminPassword
    if (process.env.NODE_ENV === 'production' && adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    let rsv;
    if (id) {
      const { data, error } = await supabaseServer.from('rsvps').select('*').eq('id', id).limit(1);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      rsv = data?.[0];
    } else if (email) {
      const { data, error } = await supabaseServer.from('rsvps').select('*').eq('email', String(email).trim().toLowerCase()).limit(1);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      rsv = data?.[0];
    } else {
      return NextResponse.json({ error: 'id or email required' }, { status: 400 });
    }

    if (!rsv) return NextResponse.json({ error: 'RSVP not found' }, { status: 404 });

    const crypto = await import('crypto');
    const token = crypto.randomBytes(20).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expires_at = new Date(Date.now() + 1000 * 60 * 60).toISOString(); // 1 hour

    const { error: insertErr } = await supabaseServer.from('rsvp_tokens').insert({ rsvp_id: rsv.id, token_hash: tokenHash, purpose: 'edit', expires_at });
    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, token });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
