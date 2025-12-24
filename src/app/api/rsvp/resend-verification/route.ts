import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabaseServer';
import { verifyRecaptchaToken } from '../../../../lib/recaptcha';
import { slidingWindowLimit } from '../../../../lib/rateLimit';
import crypto from 'crypto';

const now = () => new Date().toISOString();
const log = (...args: any[]) => console.log('[resend-verification]', now(), ...args);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { email } = body;
    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });
    email = String(email).trim().toLowerCase();

    // Find RSVP by email
    const { data, error } = await supabaseServer.from('rsvps').select('*').eq('email', email).limit(1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const rsv = data?.[0];
    if (!rsv) {
      // Don't reveal whether email exists - always return success
      return NextResponse.json({ ok: true });
    }

    // If already verified, no need to resend
    if (rsv.verified) {
      return NextResponse.json({ ok: true, message: 'Already verified' });
    }

    // Rate limiting
    try {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
      const device = req.headers.get('x-device-id') || 'unknown-device';

      const deviceKey = `rl:sw:verify:device:${device}`;
      const deviceLimit = Number(process.env.RL_SW_TOKEN_DEVICE_LIMIT || 10);
      const deviceWindowMs = Number(process.env.RL_TOKEN_REQ_WINDOW || 3600) * 1000;
      const rDev = await slidingWindowLimit(deviceKey, deviceLimit, deviceWindowMs);
      if (rDev.limited) {
        return NextResponse.json({ error: 'rate limit exceeded' }, { status: 429, headers: { 'Retry-After': String(rDev.retryAfter) } });
      }

      const emailKey = `rl:sw:verify:email:${email}`;
      const emailLimit = Number(process.env.RL_SW_TOKEN_EMAIL_LIMIT || 5);
      const rEmail = await slidingWindowLimit(emailKey, emailLimit, deviceWindowMs);
      if (rEmail.limited) {
        return NextResponse.json({ error: 'rate limit exceeded' }, { status: 429, headers: { 'Retry-After': String(rEmail.retryAfter) } });
      }
    } catch (e) { console.error('rate limit check error', e); }

    // CAPTCHA if enabled
    try {
      const siteKey = process.env.RECAPTCHA_SITE_KEY;
      const secret = process.env.RECAPTCHA_SECRET;
      const enable = (process.env.FEATURE_ENABLE_CAPTCHA === 'true') || (siteKey && secret);
      if (enable) {
        const captchaToken = body.recaptchaToken;
        if (!captchaToken) return NextResponse.json({ error: 'recaptcha required' }, { status: 400 });
        const verified = await verifyRecaptchaToken(captchaToken, 'resend-verification');
        if (!verified.success || (verified.score !== undefined && verified.score < 0.5)) {
          return NextResponse.json({ error: 'recaptcha failed' }, { status: 429 });
        }
      }
    } catch (e) { console.error('recaptcha check error', e); }

    // Create verification token
    const token = crypto.randomBytes(20).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expires_at = new Date(Date.now() + 1000 * 60 * 60).toISOString(); // 1 hour

    const { error: insertErr } = await supabaseServer.from('rsvp_tokens').insert({ 
      rsvp_id: rsv.id, 
      token_hash: tokenHash, 
      purpose: 'verify', 
      expires_at 
    });
    if (insertErr) {
      console.error('Token insert error', insertErr);
      return NextResponse.json({ error: 'Failed to create verification token' }, { status: 500 });
    }

    // Send email
    try {
      const mod = await import('../../../../lib/mail');
      const sendAsync = mod?.sendMailAsync ?? (mod?.sendMail ? (o: any) => mod.sendMail(o).then(res => { if (!res?.ok) console.error('Mail send failed', res); }).catch(e => console.error('Mail send error', e)) : null);
      const link = `${process.env.NEXT_PUBLIC_VERCEL_URL || ''}/rsvp?token=${token}`;
      const html = `<p>Hi ${rsv.name},</p>
        <p>Click the link below to verify your RSVP email. This link expires in 1 hour.</p>
        <p><a href="${link}">Verify my RSVP</a></p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>See you soon — Mette & Sigve</p>`;
      if (typeof sendAsync === 'function') {
        sendAsync({ to: email, subject: 'Mette & Sigve — Verify your RSVP', text: `Verify your RSVP: ${link}`, html });
        log('Sent verification email to', email, 'for rsvp_id', rsv.id);
      } else {
        console.warn('Mail helper not available');
      }
    } catch (mailErr) {
      console.error('Mail error', mailErr);
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
      }
    }

    // In dev, return the token for testing
    if (process.env.NODE_ENV !== 'production') {
      log('DEV verify token:', token);
      return NextResponse.json({ ok: true, devToken: token });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
