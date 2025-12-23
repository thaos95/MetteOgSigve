import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabaseServer';
import { verifyRecaptchaToken } from '../../../../lib/recaptcha';
import { isRateLimited } from '../../../../lib/rateLimit';
import crypto from 'crypto';
const now = ()=>new Date().toISOString();
const log = (...args: any[])=>console.log('[request-token]', now(), ...args);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name, purpose } = body; // purpose: 'edit' | 'cancel'
    if (!email && !name) return NextResponse.json({ error: 'email or name required' }, { status: 400 });

    // find rsvp
    let q = supabaseServer.from('rsvps').select('*').limit(1);
    if (email) q = q.eq('email', email);
    if (name) q = q.ilike('name', `%${name}%`);
    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const rsv = data?.[0];
    if (!rsv) return NextResponse.json({ error: 'RSVP not found' }, { status: 404 });

    // CAPTCHA verification + rate limiting for token requests
    try {
      const siteKey = process.env.RECAPTCHA_SITE_KEY;
      const secret = process.env.RECAPTCHA_SECRET;
      const enable = (process.env.FEATURE_ENABLE_CAPTCHA === 'true') || (siteKey && secret);
      if (enable) {
        const captchaToken = body.recaptchaToken;
        if (!captchaToken) return NextResponse.json({ error: 'recaptcha required' }, { status: 400 });
        if (typeof verifyRecaptchaToken !== 'function') {
          console.error('recaptcha check error: verifyRecaptchaToken not available');
        } else {
          const verified = await verifyRecaptchaToken(captchaToken, 'request-token');
          if (!verified.success || (verified.score !== undefined && verified.score < 0.5)) {
            return NextResponse.json({ error: 'recaptcha failed' }, { status: 429 });
          }
        }
      }
    } catch (e) { console.error('recaptcha check error', e); }

    try {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
      const ipKey = `rl:tok:req:ip:${ip}`;
      if (typeof isRateLimited !== 'function') {
        console.error('rate limit check error: isRateLimited not available');
      } else {
        const rIp = await isRateLimited(ipKey, Number(process.env.RL_TOKEN_REQ_PER_IP || 20), Number(process.env.RL_TOKEN_REQ_WINDOW || 3600));
        if (rIp.limited) return NextResponse.json({ error: 'rate limit exceeded (ip)' }, { status: 429, headers: { 'Retry-After': String(rIp.retryAfter) } });
        if (email) {
          const emailKey = `rl:tok:req:email:${email}`;
          const rEmail = await isRateLimited(emailKey, Number(process.env.RL_TOKEN_REQ_PER_EMAIL || 5), Number(process.env.RL_TOKEN_REQ_WINDOW || 3600));
          if (rEmail.limited) return NextResponse.json({ error: 'rate limit exceeded (email)' }, { status: 429, headers: { 'Retry-After': String(rEmail.retryAfter) } });
        }
      }
    } catch (e) { console.error('rate limit check error', e); }

    // Do not allow token requests for unverified email addresses
    if (rsv.email && !rsv.verified) return NextResponse.json({ error: 'Email not verified; please verify your RSVP first' }, { status: 403 });

    const token = crypto.randomBytes(20).toString('hex');
    const crypto2 = await import('crypto');
    const tokenHash = crypto2.createHash('sha256').update(token).digest('hex');
    const expires_at = new Date(Date.now() + 1000 * 60 * 60).toISOString(); // 1 hour

    const { error: insertErr } = await supabaseServer.from('rsvp_tokens').insert({ rsvp_id: rsv.id, token_hash: tokenHash, purpose: purpose || 'edit', expires_at });
    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

    // For local testing, log the raw token (do not enable in production)
    if (process.env.NODE_ENV !== 'production') console.log('DEV request-token:', token);

    // send token email
    try {
      const mod = await import('../../../../lib/mail');
      const sendAsync = mod?.sendMailAsync ?? (mod?.sendMail ? (o: any) => mod.sendMail(o).then(res => { if (!res?.ok) console.error('Mail send failed (sync fallback)', res); }).catch(e => console.error('Mail send error (sync fallback)', e)) : null);
      const link = `${process.env.NEXT_PUBLIC_VERCEL_URL || ''}/rsvp?token=${token}`;
      const html = `<p>Hi ${rsv.name},</p><p>Use the secure link below to ${purpose === 'cancel' ? 'cancel' : 'edit'} your RSVP. The link expires in 1 hour.</p><p><a href="${link}">Open RSVP</a></p>`;
      if (typeof sendAsync === 'function') {
        sendAsync({ to: rsv.email ?? rsv.email, subject: 'Mette & Sigve — RSVP secure link', text: `Open your RSVP: ${link}`, html });
        log('Triggered async token email for rsvp_id', rsv.id);
      } else {
        console.warn('Mail helper not available; skipping send');
      }
    } catch (mailErr) {
      console.error('Mail error', mailErr);
      if (process.env.NODE_ENV === 'production') return NextResponse.json({ error: 'failed to schedule email' }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}