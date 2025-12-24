import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabaseServer';

export async function PUT(req: Request, ctx: any) {
  try {
    // Resolve id from params; in some dev setups params may be a Promise and must be awaited
    let id: string | undefined;
    try {
      const params = ctx?.params;
      if (params && typeof (params as any).then === 'function') {
        const resolved = await params;
        id = resolved?.id;
      } else {
        id = params?.id;
      }
    } catch (e) {
      console.warn('Could not resolve params synchronously, falling back to URL parsing');
    }

    if (!id && process.env.NODE_ENV !== 'production') {
      const url = new URL(req.url);
      id = url.pathname.split('/').filter(Boolean).pop();
    }
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const body = await req.json();
    const { token, adminPassword } = body;
    // Support updates to new schema
    const firstName = body.firstName ? String(body.firstName).trim() : null;
    const lastName = body.lastName ? String(body.lastName).trim() : null;
    const email = body.email ? String(body.email).trim().toLowerCase() : null;
    const attending = body.attending !== undefined ? !!body.attending : undefined;
    const notes = body.notes !== undefined ? String(body.notes).trim() : undefined;
    const party = Array.isArray(body.party) ? body.party.map((p: any) => ({ firstName: String(p.firstName || '').trim(), lastName: String(p.lastName || '').trim(), attending: !!p.attending })) : undefined;

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
    if ((firstName !== null && !firstName) || (lastName !== null && !lastName)) return NextResponse.json({ error: 'First and last name required' }, { status: 400 });

    const updates: any = { updated_at: new Date().toISOString() };
    if (firstName !== null) updates.first_name = firstName;
    if (lastName !== null) updates.last_name = lastName;
    if (firstName !== null || lastName !== null) updates.name = `${firstName ?? ''} ${lastName ?? ''}`.trim();
    if (email !== null) updates.email = email;
    if (attending !== undefined) updates.attending = attending;
    if (notes !== undefined) updates.notes = notes;
    if (party !== undefined) updates.party = party;

    const { data, error } = await supabaseServer.from('rsvps').update(updates).eq('id', id).select('*');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // send update confirmation
    try {
      if (email) {
        const mod = await import('../../../../lib/mail');
        const sendAsync = mod?.sendMailAsync ?? (mod?.sendMail ? (o: any) => mod.sendMail(o).then(res => { if (!res?.ok) console.error('Mail send failed (sync fallback)', res); }).catch(e => console.error('Mail send error (sync fallback)', e)) : null);
        if (typeof sendAsync === 'function') {
          sendAsync({ to: email, subject: 'Mette & Sigve — RSVP updated', text: `Your RSVP was updated.` });
        } else {
          console.warn('Mail helper not available; skipping update email');
        }
      }
    } catch (e) { console.error(e); }

    return NextResponse.json({ ok: true, rsvp: data?.[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: any) {
  try {
    // Resolve id from params if available
    let id: string | undefined;
    try {
      const params = ctx?.params;
      if (params && typeof (params as any).then === 'function') {
        const resolved = await params;
        id = resolved?.id;
      } else {
        id = params?.id;
      }
    } catch (e) {
      console.warn('Could not resolve params for DELETE; falling back to URL parsing');
    }
    if (!id) {
      const url = new URL(req.url);
      id = url.pathname.split('/').filter(Boolean).pop();
    }
    const body = await req.json().catch(() => ({}));
    const { token, adminPassword } = body;

    // require adminPassword or token
    if (!adminPassword && !token) return NextResponse.json({ error: 'adminPassword or token required' }, { status: 401 });
    if (adminPassword && adminPassword !== process.env.ADMIN_PASSWORD) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    if (!adminPassword) {
      // verify token by hashing (consistent with PUT and verify-token)
      const crypto = await import('crypto');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const { data: tk, error: tkErr } = await supabaseServer.from('rsvp_tokens').select('*').eq('token_hash', tokenHash).eq('rsvp_id', id).limit(1);
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
