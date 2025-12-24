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

import { isRateLimited, slidingWindowLimit } from '../../../lib/rateLimit';
import { verifyRecaptchaToken } from '../../../lib/recaptcha';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Support new schema: firstName, lastName, party: Array<{firstName,lastName,attending}>
    let firstName = body.firstName ? String(body.firstName).trim() : '';
    let lastName = body.lastName ? String(body.lastName).trim() : '';
    const email = body.email ? String(body.email).trim().toLowerCase() : null;
    const attending = !!body.attending;
    const notes = body.notes ? String(body.notes).trim() : null;
    const party = Array.isArray(body.party) ? body.party.map((p: any) => ({ firstName: String(p.firstName || '').trim(), lastName: String(p.lastName || '').trim(), attending: !!p.attending })) : [];
    const overrideDuplicate = !!body.overrideDuplicate;

    // Backcompat: if legacy 'name' was provided, try to split into first/last
    if ((!firstName || !lastName) && body.name) {
      const parts = String(body.name).trim().split(/\s+/).filter(Boolean);
      if (!firstName && parts.length > 0) firstName = parts[0];
      if (!lastName && parts.length > 1) lastName = parts.slice(-1).join(' ');
    }

    // Basic validation
    if (!firstName || !lastName) return NextResponse.json({ error: "First and last name are required" }, { status: 400 });
    if (email && !isValidEmail(email)) return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    if (notes && notes.length > 1000) return NextResponse.json({ error: "Notes too long" }, { status: 400 });

    // CAPTCHA verification (if enabled by env)
    try {
      const siteKey = process.env.RECAPTCHA_SITE_KEY;
      const secret = process.env.RECAPTCHA_SECRET;
      const enable = (process.env.FEATURE_ENABLE_CAPTCHA === 'true') || (siteKey && secret);
      if (enable) {
        const captchaToken = body.recaptchaToken;
        if (!captchaToken) return NextResponse.json({ error: 'recaptcha required' }, { status: 400 });
        const verified = await verifyRecaptchaToken(captchaToken, 'rsvp');
        if (process.env.NODE_ENV !== 'production') console.log('recaptcha verify result', verified);
        if (!verified.success || (verified.score !== undefined && verified.score < 0.5)) {
          return NextResponse.json({ error: 'recaptcha failed' }, { status: 429 });
        }
      }
    } catch (e) { console.error('recaptcha check error', e); }

    // Rate limiting: per-IP and per-email (same as before)
    try {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
      const device = req.headers.get('x-device-id') || 'unknown-device';

      // Device sliding window (shorter window)
      const deviceKey = `rl:sw:rsvp:device:${device}`;
      const devLimit = Number(process.env.RL_SW_RSVP_DEVICE_LIMIT || 10);
      const devWindowMs = Number(process.env.RL_RSVP_WINDOW || 86400) * 1000; // default 1 day window
      const rDev = await slidingWindowLimit(deviceKey, devLimit, devWindowMs);
      if (rDev.limited) return NextResponse.json({ error: 'rate limit exceeded (device)' }, { status: 429, headers: { 'Retry-After': String(rDev.retryAfter) } });

      // IP sliding window
      const ipKey = `rl:sw:rsvp:ip:${ip}`;
      const ipLimit = Number(process.env.RL_SW_RSVP_IP_LIMIT || 200);
      const ipWindowMs = Number(process.env.RL_RSVP_WINDOW || 86400) * 1000;
      const rIp = await slidingWindowLimit(ipKey, ipLimit, ipWindowMs);
      if (rIp.limited) return NextResponse.json({ error: 'rate limit exceeded (ip)' }, { status: 429, headers: { 'Retry-After': String(rIp.retryAfter) } });

      // Per-email sliding window
      if (email) {
        const emailKey = `rl:sw:rsvp:email:${email}`;
        const baseLimit = Number(process.env.RL_SW_RSVP_EMAIL_LIMIT || 5);
        const emailLimit = baseLimit; // could increase for verified users
        const rEmail = await slidingWindowLimit(emailKey, emailLimit, ipWindowMs);
        if (rEmail.limited) return NextResponse.json({ error: 'rate limit exceeded (email)' }, { status: 429, headers: { 'Retry-After': String(rEmail.retryAfter) } });
      }
    } catch (e) { console.error('rate limit check error', e); }

    // Fuzzy duplicate detection (email exact OR person overlap)
    try {
      // Normalize helpers
      const normalize = (s: string) => s?.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
      const tokens = (s: string) => normalize(s).split(/\s+/).filter(Boolean);
      const personMatches = (a: any, b: any) => {
        const aFirst = tokens(a.firstName || '');
        const bFirst = tokens(b.firstName || '');
        const aLast = tokens(a.lastName || '');
        const bLast = tokens(b.lastName || '');
        if (aLast.length === 0 || bLast.length === 0) return false;
        // require last name to match (exact tokens) or contain each other
        if (aLast.join(' ') !== bLast.join(' ') && !aLast.some(x => bLast.includes(x)) && !bLast.some(x => aLast.includes(x))) return false;
        // first name fuzzy match: exact token, prefix match or first 3 chars equal
        return aFirst.some(x => bFirst.some(y => x === y || x.startsWith(y) || y.startsWith(x) || (x.length >= 3 && y.length >= 3 && x.slice(0,3) === y.slice(0,3))));
      };

      const primary = { firstName, lastName };
      const newPeople = [ primary, ...party ];

      // gather candidates: email match (strong) + last name-like matches
      const candidates: any[] = [];
      if (email) {
        const r = await supabaseServer.from('rsvps').select('*').eq('email', email).limit(1);
        if (r.error) return NextResponse.json({ error: r.error.message }, { status: 500 });
        if (r.data && r.data.length > 0) candidates.push(...r.data);
      }
      // last-name / name matches — use `name` ilike for compatibility if last_name column is not present
      if (lastName) {
        const res = await supabaseServer.from('rsvps').select('*').ilike('name', `%${lastName}%`).limit(20);
        if (res.error) return NextResponse.json({ error: res.error.message }, { status: 500 });
        candidates.push(...(res.data || []));
      }
      // name token matches (fallback on first name)
      if (firstName) {
        const res2 = await supabaseServer.from('rsvps').select('*').ilike('name', `%${firstName}%`).limit(20);
        if (res2.error) return NextResponse.json({ error: res2.error.message }, { status: 500 });
        candidates.push(...(res2.data || []));
      }

      // dedupe candidates by id
      const uniq: Record<string, any> = {};
      for (const c of candidates) { if (c && c.id) uniq[c.id] = c; }
      const uniqList = Object.values(uniq);

      for (const cand of uniqList) {
        const candPeople: any[] = [];
        // primary candidate name
        const cFirst = cand.first_name || (cand.name ? (cand.name.split(/\s+/)[0] || '') : '');
        const cLast = cand.last_name || (cand.name ? (cand.name.split(/\s+/).slice(-1).join(' ') || '') : '');
        candPeople.push({ firstName: cFirst, lastName: cLast });
        // party members if present (JSONB)
        try {
          const cparty = cand.party && Array.isArray(cand.party) ? cand.party : (typeof cand.party === 'string' && cand.party ? JSON.parse(cand.party) : []);
          if (Array.isArray(cparty)) candPeople.push(...cparty.map((p: any) => ({ firstName: p.firstName || '', lastName: p.lastName || '' })));
        } catch (e) { /* ignore parsing errors */ }

        // Check for person overlap
        const matches: any[] = [];
        for (const np of newPeople) {
          for (const cp of candPeople) {
            if (personMatches(np, cp)) matches.push({ new: np, existing: cp });
          }
        }
        if (matches.length > 0 && !overrideDuplicate) {
          // Return possible duplicate with existing record for UI to prompt
          return NextResponse.json({ error: 'possible duplicate', existing: cand, matches }, { status: 409 });
        }
      }
    } catch (e) {
      console.error('duplicate check error', e);
    }

    // OK to insert
    const fullName = `${firstName} ${lastName}`;
    const insertObj: any = { name: fullName, first_name: firstName, last_name: lastName, email, attending, notes, verified: false, party };
    let inserted: any = null;
    let insertErr: any = null;
    try {
      const res = await supabaseServer.from('rsvps').insert(insertObj).select('*');
      inserted = res.data;
      insertErr = res.error;
    } catch (e: any) {
      insertErr = e;
    }

    // If insert failed due to missing columns (migration not applied), retry with legacy columns (name only)
    if (insertErr) {
      const msg = String(insertErr?.message || insertErr);
      if (msg.includes('first_name') || msg.includes('last_name') || msg.includes('party')) {
        console.warn('Insert failed likely due to missing migration columns; retrying legacy insert (apply migration to enable full schema)');
        const legacyObj: any = { name: fullName, email, attending, notes, verified: false };
        const res2 = await supabaseServer.from('rsvps').insert(legacyObj).select('*');
        if (res2.error) return NextResponse.json({ error: res2.error.message }, { status: 500 });
        inserted = res2.data;
      } else {
        return NextResponse.json({ error: insertErr.message ?? String(insertErr) }, { status: 500 });
      }
    }

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
          // Do not block the request on email delivery; send asynchronously
          const sendAsync = mod?.sendMailAsync ?? ((o: any) => sendMail(o).then(res => { if (!res?.ok) console.error('Mail send failed (sync fallback)', res); }).catch(e => console.error('Mail send error (sync fallback)', e)));
          sendAsync({ to: email, subject: 'Mette & Sigve — Verify your RSVP', text: `Please verify your RSVP: ${link}`, html });
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