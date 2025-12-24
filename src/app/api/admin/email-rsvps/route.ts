import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";
import { logAdminAction } from "../../../../lib/adminAudit";
import nodemailer from "nodemailer";

function csvEscape(value: any) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (s.includes('"') || s.includes(',') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const password = body?.password;
    const toEmail = body?.to;
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (!toEmail) return NextResponse.json({ error: 'Missing "to" email address' }, { status: 400 });

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.FROM_EMAIL) {
      return NextResponse.json({ error: 'SMTP not configured. Set SMTP_HOST, SMTP_PORT(optional), SMTP_USER, SMTP_PASS, FROM_EMAIL' }, { status: 500 });
    }

    const { data, error } = await supabaseServer.from('rsvps').select('*').order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const rows = data ?? [];

    const includePartyRows = !!body?.include_party_rows;
    const personNameFilter = body?.person_name ? String(body.person_name).trim().toLowerCase() : null;
    const personAttendingFilter = body?.person_attending ?? null; // 'yes'|'no'

    // Flatten to per-person CSV rows: primary + party members
    const headers = ['rsvp_id','rsvp_name','rsvp_email','person_role','person_first','person_last','person_attending','rsvp_attending','notes','created_at'];
    const flatRows: any[] = [];
    for (const r of rows) {
      const rsvpId = r.id;
      const rsvpName = r.name || `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim();
      const rsvpEmail = r.email || '';
      const rsvpAttending = !!r.attending;
      const createdAt = r.created_at;
      const notes = r.notes ?? '';

      // primary person
      const primaryFirst = r.first_name || (r.name ? String(r.name).split(/\s+/)[0] : '');
      const primaryLast = r.last_name || (r.name ? String(r.name).split(/\s+/).slice(-1).join(' ') : '');
      flatRows.push({ rsvp_id: rsvpId, rsvp_name: rsvpName, rsvp_email: rsvpEmail, person_role: 'primary', person_first: primaryFirst, person_last: primaryLast, person_attending: rsvpAttending, rsvp_attending: rsvpAttending, notes, created_at: createdAt });

      // party members
      let party = [];
      try {
        if (Array.isArray(r.party)) party = r.party;
        else if (r.party && typeof r.party === 'string') party = JSON.parse(r.party);
      } catch (e) { party = []; }
      if (Array.isArray(party)) {
        for (const p of party) {
          const pf = p.firstName || p.first_name || '';
          const pl = p.lastName || p.last_name || '';
          const pa = p.attending !== undefined ? !!p.attending : rsvpAttending;
          flatRows.push({ rsvp_id: rsvpId, rsvp_name: rsvpName, rsvp_email: rsvpEmail, person_role: 'guest', person_first: pf, person_last: pl, person_attending: pa, rsvp_attending: rsvpAttending, notes, created_at: createdAt });
        }
      }
    }

    // If filters provided, filter
    let filteredRows = flatRows;
    if (personNameFilter || personAttendingFilter) {
      filteredRows = flatRows.filter(fr => {
        if (personNameFilter) {
          const nm = String(fr.person_first || '').toLowerCase().includes(personNameFilter) || String(fr.person_last || '').toLowerCase().includes(personNameFilter) || String(fr.rsvp_name || '').toLowerCase().includes(personNameFilter);
          if (!nm) return false;
        }
        if (personAttendingFilter === 'yes' && !fr.person_attending) return false;
        if (personAttendingFilter === 'no' && fr.person_attending) return false;
        return true;
      });
    }

    const csv = [headers.join(',')].concat(filteredRows.map(r => headers.map(h => csvEscape(r[h])).join(','))).join('\n');

    // If requested, return CSV directly (useful for testing) instead of sending via SMTP
    if (body?.download === true) {
      return NextResponse.json({ ok: true, csv });
    }

    // create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
      secure: (process.env.SMTP_SECURE === 'true') || false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: toEmail,
      subject: `Mette & Sigve RSVPs backup (${new Date().toISOString()})`,
      text: 'Attached is the CSV export of RSVPs.',
      attachments: [{ filename: 'rsvps.csv', content: csv }]
    });

    // Audit log email export
    const adminEmail = process.env.ADMIN_EMAIL || 'admin';
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null;
    const deviceId = req.headers.get('x-device-id') || null;
    await logAdminAction({ adminEmail, action: 'email-rsvps-backup', targetTable: 'rsvps', targetId: toEmail, before: null, after: { rowCount: filteredRows.length, sentTo: toEmail, filters: { personNameFilter, personAttendingFilter } }, ip, deviceId });

    return NextResponse.json({ ok: true, info });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}