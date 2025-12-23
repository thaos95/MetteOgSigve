import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

function isValidEmail(email?: string) {
  if (!email) return true;
  const re = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  return re.test(email);
}

function normalizeName(n: string) {
  return n
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeLike(s: string) {
  return s.replace(/([%_\\])/g, "\\$1");
}

import { isRateLimited } from '../../../lib/rateLimit';
import { verifyRecaptchaToken } from '../../../lib/recaptcha';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = (body.name ?? "").toString().trim();
    const email = body.email ? String(body.email).trim().toLowerCase() : null;
    const attending = !!body.attending;
    const guests = Number.isFinite(Number(body.guests)) ? Number(body.guests) : 0;
    const notes = body.notes ? String(body.notes).trim() : null;

    // CAPTCHA verification (if enabled by env)
    try {
      const siteKey = process.env.RECAPTCHA_SITE_KEY;
      const secret = process.env.RECAPTCHA_SECRET;
      const enable = (process.env.FEATURE_ENABLE_CAPTCHA === 'true') || (siteKey && secret);
      if (enable) {
        const captchaToken = body.recaptchaToken;
        if (!captchaToken) return NextResponse.json({ error: 'recaptcha required' }, { status: 400 });
        const verified = await verifyRecaptchaToken(captchaToken, 'rsvp');
        if (!verified.success || (verified.score !== undefined && verified.score < 0.5)) {
          return NextResponse.json({ error: 'recaptcha failed' }, { status: 429 });
        }
      }
    } catch (e) { console.error('recaptcha check error', e); }

    // Rate limiting: per-IP and per-email
    try {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
      const ipKey = `rl:rsvp:ip:${ip}`;
      const rIp = await isRateLimited(ipKey, Number(process.env.RL_RSVP_PER_IP || 10), Number(process.env.RL_RSVP_WINDOW || 86400));
      if (rIp.limited) return NextResponse.json({ error: 'rate limit exceeded (ip)' }, { status: 429, headers: { 'Retry-After': String(rIp.retryAfter) } });
      if (email) {
        const emailKey = `rl:rsvp:email:${email}`;
        const rEmail = await isRateLimited(emailKey, Number(process.env.RL_RSVP_PER_EMAIL || 5), Number(process.env.RL_RSVP_WINDOW_EMAIL || 86400));
        if (rEmail.limited) return NextResponse.json({ error: 'rate limit exceeded (email)' }, { status: 429, headers: { 'Retry-After': String(rEmail.retryAfter) } });
      }
    } catch (e) { console.error('rate limit check error', e); }

    // Basic validation
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (name.length > 200) return NextResponse.json({ error: "Name too long" }, { status: 400 });
    if (email && !isValidEmail(email)) return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    if (guests < 0 || guests > 20) return NextResponse.json({ error: "Guests must be between 0 and 20" }, { status: 400 });
    if (notes && notes.length > 1000) return NextResponse.json({ error: "Notes too long" }, { status: 400 });

    // Stricter duplicate heuristics
    const normName = normalizeName(name);
    const nameParts = normName.split(' ').filter(Boolean);

    // 1) Exact email match (strong indicator)
    if (email) {
      const res = await supabaseServer.from('rsvps').select('id,name,email').eq('email', email).limit(1);
      if (res.error) return NextResponse.json({ error: res.error.message }, { status: 500 });
      if (res.data && res.data.length > 0) return NextResponse.json({ error: 'An RSVP with this email already exists' }, { status: 409 });
    }

    // 2) If name has at least first and last token, require both tokens to appear in an existing name (stricter)
    if (nameParts.length > 1) {
      const first = escapeLike(nameParts[0]);
      const last = escapeLike(nameParts[nameParts.length - 1]);
      // check for a record where name contains both tokens
      const both = await supabaseServer
        .from('rsvps')
        .select('id,name,email')
        .ilike('name', `%${first}%`)
        .ilike('name', `%${last}%`)
        .limit(1);
      if (both.error) return NextResponse.json({ error: both.error.message }, { status: 500 });
      if (both.data && both.data.length > 0) return NextResponse.json({ error: 'An RSVP with this name appears to exist' }, { status: 409 });
    } else if (nameParts.length === 1) {
      // fallback: single token match (first or surname)
      const token = escapeLike(nameParts[0]);
      const tokenRes = await supabaseServer.from('rsvps').select('id,name,email').ilike('name', `%${token}%`).limit(1);
      if (tokenRes.error) return NextResponse.json({ error: tokenRes.error.message }, { status: 500 });
      if (tokenRes.data && tokenRes.data.length > 0) return NextResponse.json({ error: 'An RSVP with this name appears to exist' }, { status: 409 });
    }

    // 3) Also check for exact (case-insensitive) name match as final guard
    const exact = await supabaseServer.from('rsvps').select('id,name,email').ilike('name', name).limit(1);
    if (exact.error) return NextResponse.json({ error: exact.error.message }, { status: 500 });
    if (exact.data && exact.data.length > 0) return NextResponse.json({ error: 'An RSVP with this name already exists' }, { status: 409 });

    const { data: inserted, error } = await supabaseServer.from("rsvps").insert({ name, email, attending, guests, notes, verified: false }).select('*');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // If an email was provided, create a verification token (hashed in DB) and email the raw token to user
    try {
      if (email) {
        const crypto = await import('crypto');
        const token = crypto.randomBytes(20).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const expires_at = new Date(Date.now() + 1000 * 60 * 60).toISOString(); // 1 hour

        const { error: insertErr } = await supabaseServer.from('rsvp_tokens').insert({ rsvp_id: inserted?.[0].id, token_hash: tokenHash, purpose: 'verify', expires_at }).select('*');
        if (insertErr) console.error('Token insert error', insertErr);

        // For local testing, log the raw token (do not enable in production)
        if (process.env.NODE_ENV !== 'production') console.log('DEV verify token:', token);

        const mod = await import('../../../lib/mail');
        const sendMail = mod?.sendMail;
        const link = `${process.env.NEXT_PUBLIC_VERCEL_URL || ''}/rsvp?token=${token}`;
        const html = `<p>Hi ${name},</p>
          <p>Thanks — your RSVP has been recorded. Please <a href="${link}">verify your email</a> to confirm. This link expires in 1 hour.</p>
          <ul>
            <li><strong>Attending:</strong> ${attending ? 'Yes' : 'No'}</li>
            <li><strong>Guests:</strong> ${guests}</li>
            <li><strong>Notes:</strong> ${notes ?? ''}</li>
          </ul>
          <p>If you want to edit or cancel you can use the request token flow once verified.</p>
          <p>See you soon — Mette & Sigve</p>`;
        if (typeof sendMail === 'function') {
          const res = await sendMail({ to: email, subject: 'Mette & Sigve — Verify your RSVP', text: `Please verify your RSVP: ${link}`, html });
          if (!res?.ok) console.error('Mail send failed', res);
        } else {
          console.warn('sendMail not available; skipping email send in this environment');
        }
      }
    } catch (mailErr) {
      console.error('Mail error', mailErr);
    }

    return NextResponse.json({ ok: true, rsvp: inserted?.[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}