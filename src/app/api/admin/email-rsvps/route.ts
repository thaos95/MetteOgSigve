import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";
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
    const headers = ['id','name','email','attending','guests','notes','created_at'];
    const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => csvEscape(r[h])).join(','))).join('\n');

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

    return NextResponse.json({ ok: true, info });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}