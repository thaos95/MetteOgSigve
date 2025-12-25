import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabaseServer';
import { verifyRecaptchaToken } from '../../../../lib/recaptcha';
import { isRateLimited, slidingWindowLimit } from '../../../../lib/rateLimit';
import { tokenEmail } from '../../../../lib/emailTemplates';
import crypto from 'crypto';
const now = ()=>new Date().toISOString();
const log = (...args: any[])=>console.log('[request-token]', now(), ...args);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { email, name, purpose } = body; // purpose: 'edit' | 'cancel'
    if (!email && !name) return NextResponse.json({ error: 'email or name required' }, { status: 400 });
    // normalize email for lookups & rate-limit keys
    email = email ? String(email).trim().toLowerCase() : undefined;

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
          if (process.env.NODE_ENV !== 'production') console.log('recaptcha verify result', verified);
          if (!verified.success || (verified.score !== undefined && verified.score < 0.5)) {
            return NextResponse.json({ error: 'recaptcha failed' }, { status: 429 });
          }
        }
      }
    } catch (e) { console.error('recaptcha check error', e); }

    try {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
      const device = req.headers.get('x-device-id') || body.deviceId || 'unknown-device';

      // Device-level sliding window (short window, tight limit)
      const deviceKey = `rl:sw:token:device:${device}`;
      const deviceLimit = Number(process.env.RL_SW_TOKEN_DEVICE_LIMIT || 10);
      const deviceWindowMs = Number(process.env.RL_TOKEN_REQ_WINDOW || 3600) * 1000;
      const rDev = await slidingWindowLimit(deviceKey, deviceLimit, deviceWindowMs);
      if (rDev.limited) {
        // Escalate: require recaptcha to proceed if device is limited
        const captchaToken = body.recaptchaToken;
        if (!captchaToken) return NextResponse.json({ error: 'recaptcha required' }, { status: 400 });
        try {
          const verified = await verifyRecaptchaToken(captchaToken, 'request-token');
          if (process.env.NODE_ENV !== 'production') console.log('recaptcha verify result (escalation)', verified);
          if (!verified.success || (verified.score !== undefined && verified.score < 0.5)) {
            return NextResponse.json({ error: 'recaptcha failed' }, { status: 429 });
          }
        } catch (e) { console.error('recaptcha check error during escalation', e); }
      }

      // IP sliding window (bigger limit)
      const ipKey = `rl:sw:token:ip:${ip}`;
      const ipLimit = Number(process.env.RL_SW_TOKEN_IP_LIMIT || 50);
      const ipWindowMs = Number(process.env.RL_TOKEN_REQ_WINDOW || 3600) * 1000;
      const rIp = await slidingWindowLimit(ipKey, ipLimit, ipWindowMs);
      if (rIp.limited) return NextResponse.json({ error: 'rate limit exceeded (ip)' }, { status: 429, headers: { 'Retry-After': String(rIp.retryAfter) } });

      // Per-email sliding window (respect optional sendToEmail if provided)
      const sendTo = body.sendToEmail ? String(body.sendToEmail).trim().toLowerCase() : email;
      if (sendTo) {
        const emailKey = `rl:sw:token:email:${sendTo}`;
        const baseLimit = Number(process.env.RL_SW_TOKEN_EMAIL_LIMIT || 5);
        const emailLimit = (rsv?.verified ? baseLimit * 2 : baseLimit);
        const rEmail = await slidingWindowLimit(emailKey, emailLimit, ipWindowMs);
        if (rEmail.limited) return NextResponse.json({ error: 'rate limit exceeded (email)' }, { status: 429, headers: { 'Retry-After': String(rEmail.retryAfter) } });
      }
    } catch (e) { console.error('rate limit check error', e); }

    // POLICY: Allow edit/cancel token requests even for unverified RSVPs
    // Rationale: Token delivery to the email inbox itself proves ownership.
    // Rate limiting + CAPTCHA provide abuse protection.
    // When the guest uses the edit token, we implicitly verify their RSVP.

    const token = crypto.randomBytes(20).toString('hex');
    const crypto2 = await import('crypto');
    const tokenHash = crypto2.createHash('sha256').update(token).digest('hex');
    const expires_at = new Date(Date.now() + 1000 * 60 * 60).toISOString(); // 1 hour

    const { error: insertErr } = await supabaseServer.from('rsvp_tokens').insert({ rsvp_id: rsv.id, token_hash: tokenHash, purpose: purpose || 'edit', expires_at });
    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

    // For local testing, log the raw token (do not enable in production)
    if (process.env.NODE_ENV !== 'production') console.log('DEV request-token:', token);

    // Optionally update the RSVP's email if requested
    const sendTo = body.sendToEmail ? String(body.sendToEmail).trim().toLowerCase() : email;
    if (body.updateEmail && sendTo) {
      // ensure no other RSVP uses that email
      const { data: dup, error: dupErr } = await supabaseServer.from('rsvps').select('id').eq('email', sendTo).limit(1);
      if (dupErr) return NextResponse.json({ error: dupErr.message }, { status: 500 });
      if (dup && dup.length && dup[0].id !== rsv.id) return NextResponse.json({ error: 'email already in use by another RSVP' }, { status: 409 });
      const { error: updErr } = await supabaseServer.from('rsvps').update({ email: sendTo, verified: false, updated_at: new Date().toISOString() }).eq('id', rsv.id);
      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
      log('Updated RSVP email for rsvp_id', rsv.id, 'to', sendTo);
    }

    // send token email
    try {
      const mod = await import('../../../../lib/mail');
      const sendAsync = mod?.sendMailAsync ?? (mod?.sendMail ? (o: any) => mod.sendMail(o).then(res => { if (!res?.ok) console.error('Mail send failed (sync fallback)', res); }).catch(e => console.error('Mail send error (sync fallback)', e)) : null);
      const getBaseUrl = mod?.getBaseUrl;
      const link = `${getBaseUrl?.() ?? ''}/rsvp?token=${token}`;
      
      // Generate email using template
      const emailContent = tokenEmail({
        name: rsv.first_name || rsv.name?.split(' ')[0] || 'there',
        link,
        purpose: purpose === 'cancel' ? 'cancel' : 'edit',
      });
      
      if (typeof sendAsync === 'function') {
        sendAsync({ 
          to: sendTo ?? rsv.email, 
          subject: emailContent.subject, 
          text: emailContent.text, 
          html: emailContent.html 
        });
        log('Triggered async token email for rsvp_id', rsv.id, 'to', sendTo ?? rsv.email);
      } else {
        console.warn('Mail helper not available; skipping send');
      }
    } catch (mailErr) {
      console.error('Mail error', mailErr);
      if (process.env.NODE_ENV === 'production') return NextResponse.json({ error: 'failed to schedule email' }, { status: 500 });
    }

    // respond with dev token for local testing
    if (process.env.NODE_ENV !== 'production') return NextResponse.json({ ok: true, devToken: token });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}