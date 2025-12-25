import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";
import { createRsvpSchema } from "../../../domain/rsvp/schema";
import { normalizeName, tokenizeName, splitName } from "../../../domain/rsvp/validation";
import { personMatches, checkForDuplicates, extractPeopleFromRsvp } from "../../../domain/rsvp/duplicate";
import { AppError, errorResponse, zodToAppError, handleUnknownError, legacyErrorResponse } from "../../../lib/errors";
import { applyRsvpRateLimits } from '../../../lib/rateLimit';
import { verifyRecaptchaToken } from '../../../lib/recaptcha';
import type { ZodError } from 'zod';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // ─────────────────────────────────────────────────────────────────────────
    // 1. Parse & validate input with Zod schema
    // ─────────────────────────────────────────────────────────────────────────
    
    // Handle legacy 'name' field by splitting it
    if ((!body.firstName || !body.lastName) && body.name) {
      const { firstName: f, lastName: l } = splitName(String(body.name));
      if (!body.firstName) body.firstName = f;
      if (!body.lastName) body.lastName = l;
    }
    
    const parseResult = createRsvpSchema.safeParse(body);
    if (!parseResult.success) {
      return errorResponse(zodToAppError(parseResult.error as ZodError));
    }
    
    const { firstName, lastName, email, attending, party, notes, recaptchaToken, overrideDuplicate } = parseResult.data;

    // ─────────────────────────────────────────────────────────────────────────
    // 2. CAPTCHA verification
    // ─────────────────────────────────────────────────────────────────────────
    try {
      const siteKey = process.env.RECAPTCHA_SITE_KEY;
      const secret = process.env.RECAPTCHA_SECRET;
      const enable = (process.env.FEATURE_ENABLE_CAPTCHA === 'true') || (siteKey && secret);
      if (enable) {
        if (!recaptchaToken) {
          return errorResponse(AppError.validation('recaptcha required'));
        }
        const verified = await verifyRecaptchaToken(recaptchaToken, 'rsvp');
        if (process.env.NODE_ENV !== 'production') console.log('recaptcha verify result', verified);
        if (!verified.success || (verified.score !== undefined && verified.score < 0.5)) {
          return errorResponse(AppError.rateLimited(60, 'recaptcha failed'));
        }
      }
    } catch (e) { console.error('recaptcha check error', e); }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. Rate limiting (using new centralized presets)
    // ─────────────────────────────────────────────────────────────────────────
    try {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
      const deviceId = req.headers.get('x-device-id') || 'unknown-device';
      
      await applyRsvpRateLimits({ ip, deviceId, email: email ?? undefined });
    } catch (e) {
      if (e instanceof AppError) {
        return errorResponse(e);
      }
      console.error('rate limit check error', e);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. Fuzzy duplicate detection (using domain module)
    // ─────────────────────────────────────────────────────────────────────────
    if (!overrideDuplicate) {
      try {
        const primary = { firstName, lastName };
        
        // Gather candidate RSVPs from database
        const candidates: any[] = [];
        
        // Email match (strong signal)
        if (email) {
          const r = await supabaseServer.from('rsvps').select('*').eq('email', email).limit(1);
          if (r.error) return legacyErrorResponse(r.error.message, 500);
          if (r.data?.length) candidates.push(...r.data);
        }
        
        // Name-based matches
        if (lastName) {
          const res = await supabaseServer.from('rsvps').select('*').ilike('name', `%${lastName}%`).limit(20);
          if (res.error) return legacyErrorResponse(res.error.message, 500);
          candidates.push(...(res.data || []));
        }
        if (firstName) {
          const res2 = await supabaseServer.from('rsvps').select('*').ilike('name', `%${firstName}%`).limit(20);
          if (res2.error) return legacyErrorResponse(res2.error.message, 500);
          candidates.push(...(res2.data || []));
        }

        // Use domain module for duplicate detection
        const duplicateResult = checkForDuplicates(primary, party, candidates);
        if (duplicateResult.isDuplicate && duplicateResult.candidate) {
          // Return possible duplicate with existing record for UI to prompt
          return NextResponse.json({ 
            error: 'possible duplicate', 
            existing: duplicateResult.candidate, 
            matches: duplicateResult.matches 
          }, { status: 409 });
        }
      } catch (e) {
        console.error('duplicate check error', e);
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. Insert RSVP
    // ─────────────────────────────────────────────────────────────────────────
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

    // If insert failed due to missing columns (migration not applied), retry with legacy columns
    if (insertErr) {
      const msg = String(insertErr?.message || insertErr);
      if (msg.includes('first_name') || msg.includes('last_name') || msg.includes('party')) {
        console.warn('Insert failed likely due to missing migration columns; retrying legacy insert');
        const legacyObj: any = { name: fullName, email, attending, notes, verified: false };
        const res2 = await supabaseServer.from('rsvps').insert(legacyObj).select('*');
        if (res2.error) return legacyErrorResponse(res2.error.message, 500);
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
        const getBaseUrl = mod?.getBaseUrl;
        const link = `${getBaseUrl?.() ?? ''}/rsvp?token=${token}`;
        const guestList = (Array.isArray(party) && party.length > 0) ? party.map((p:any)=>`${p.firstName||p.first_name||''} ${p.lastName||p.last_name||''}`.trim()).filter(Boolean).join(', ') : 'None';
        const html = `<p>Hi ${fullName},</p>
          <p>Thanks — your RSVP has been recorded. Please <a href="${link}">verify your email</a> to confirm. This link expires in 1 hour.</p>
          <ul>
            <li><strong>Attending:</strong> ${attending ? 'Yes' : 'No'}</li>
            <li><strong>Guests:</strong> ${guestList}</li>
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
  } catch (err: unknown) {
    const appErr = handleUnknownError(err, 'rsvp-post');
    return errorResponse(appErr);
  }
}