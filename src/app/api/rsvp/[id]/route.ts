import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabaseServer';

export async function PUT(req: Request, { params }: { params: { id: string } } = { params: { id: undefined } }) {
  try {
    // Resolve id from params; in some dev setups params may be empty, so fall back to parsing the URL only in non-production
    let id = params?.id;
    if (!id && process.env.NODE_ENV !== 'production') {
      const url = new URL(req.url);
      id = url.pathname.split('/').filter(Boolean).pop();
    }
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const body = await req.json();
    const { name, email, attending, guests, notes, token, adminPassword } = body;

    // require either adminPassword or valid token for edits
    if (!adminPassword && !token) return NextResponse.json({ error: 'adminPassword or token required' }, { status: 401 });
    if (adminPassword && adminPassword !== process.env.ADMIN_PASSWORD) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    if (!adminPassword) {
      // verify token
      const crypto = await import('crypto');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const { data: tk, error: tkErr } = await supabaseServer.from('rsvp_tokens').select('*').eq('token_hash', tokenHash).eq('rsvp_id', id).limit(1);
      if (tkErr) return NextResponse.json({ error: tkErr.message }, { status: 500 });
      const row = tk?.[0];
      if (!row) return NextResponse.json({ error: 'invalid token' }, { status: 401 });
      if (row.used) return NextResponse.json({ error: 'token already used' }, { status: 401 });
      if (row.expires_at && new Date(row.expires_at) < new Date()) return NextResponse.json({ error: 'token expired' }, { status: 410 });

      // mark token used
      await supabaseServer.from('rsvp_tokens').update({ used: true }).eq('id', row.id);
    }

    // basic validation
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

    const { data, error } = await supabaseServer.from('rsvps').update({ name, email, attending, guests, notes, updated_at: new Date().toISOString() }).eq('id', id).select('*');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // send update confirmation
    try {
      if (email) {
        const { sendMail } = await import('../../../../lib/mail');
        await sendMail({ to: email, subject: 'Mette & Sigve — RSVP updated', text: `Your RSVP was updated.` });
      }
    } catch (e) { console.error(e); }

    return NextResponse.json({ ok: true, rsvp: data?.[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } } = { params: { id: undefined } }) {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split('/').filter(Boolean).pop();
    const body = await req.json().catch(() => ({}));
    const { token, adminPassword } = body;

    // require adminPassword or token
    if (!adminPassword && !token) return NextResponse.json({ error: 'adminPassword or token required' }, { status: 401 });
    if (adminPassword && adminPassword !== process.env.ADMIN_PASSWORD) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    if (!adminPassword) {
      const { data: tk, error: tkErr } = await supabaseServer.from('rsvp_tokens').select('*').eq('token', token).eq('rsvp_id', id).limit(1);
      if (tkErr) return NextResponse.json({ error: tkErr.message }, { status: 500 });
      const row = tk?.[0];
      if (!row) return NextResponse.json({ error: 'invalid token' }, { status: 401 });
      if (row.used) return NextResponse.json({ error: 'token already used' }, { status: 401 });
      if (row.expires_at && new Date(row.expires_at) < new Date()) return NextResponse.json({ error: 'token expired' }, { status: 410 });
      await supabaseServer.from('rsvp_tokens').update({ used: true }).eq('id', row.id);
    }

    const { data: existing, error: fetchErr } = await supabaseServer.from('rsvps').select('*').eq('id', id).limit(1);
    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    const row = existing?.[0];
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // perform soft-delete via setting cancelled=true and adding updated_at
    const { data, error } = await supabaseServer.from('rsvps').update({ cancelled: true, updated_at: new Date().toISOString() }).eq('id', id).select('*');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // send cancellation email if possible
    try {
      if (row.email) {
        const { sendMail } = await import('../../../../lib/mail');
        await sendMail({ to: row.email, subject: 'Mette & Sigve — RSVP cancelled', text: `Your RSVP for ${row.name} was cancelled.` });
      }
    } catch (e) { console.error(e); }

    return NextResponse.json({ ok: true, rsvp: data?.[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
