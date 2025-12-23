import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabaseServer';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await req.json();
    const { name, email, attending, guests, notes } = body;

    // basic validation
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

    const { data, error } = await supabaseServer.from('rsvps').update({ name, email, attending, guests, notes }).eq('id', id).select('*');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // send update confirmation
    try {
      if (email) {
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
          secure: (process.env.SMTP_SECURE === 'true') || false,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        });
        await transporter.sendMail({ from: process.env.FROM_EMAIL, to: email, bcc: process.env.FROM_EMAIL, subject: 'Mette & Sigve — RSVP updated', text: `Your RSVP was updated.` });
      }
    } catch (e) { console.error(e); }

    return NextResponse.json({ ok: true, rsvp: data?.[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
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
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
          secure: (process.env.SMTP_SECURE === 'true') || false,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        });
        await transporter.sendMail({ from: process.env.FROM_EMAIL, to: row.email, bcc: process.env.FROM_EMAIL, subject: 'Mette & Sigve — RSVP cancelled', text: `Your RSVP for ${row.name} was cancelled.` });
      }
    } catch (e) { console.error(e); }

    return NextResponse.json({ ok: true, rsvp: data?.[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
