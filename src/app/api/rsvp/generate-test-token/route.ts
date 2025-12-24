import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabaseServer';
import { AppError, errorResponse, handleUnknownError } from '../../../../lib/errors';

/**
 * Generate a test token for development/debugging.
 * 
 * SECURITY: This endpoint is gated:
 * - In development: Freely accessible
 * - In production: Requires ADMIN_PASSWORD
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, email, adminPassword } = body || {};

    // ─────────────────────────────────────────────────────────────────────────
    // Production gate: Require admin password in production
    // ─────────────────────────────────────────────────────────────────────────
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction && adminPassword !== process.env.ADMIN_PASSWORD) {
      return errorResponse(AppError.unauthorized('This endpoint requires admin authentication in production'));
    }

    // Find the RSVP
    let rsv;
    if (id) {
      const { data, error } = await supabaseServer.from('rsvps').select('*').eq('id', id).limit(1);
      if (error) return errorResponse(new AppError('INTERNAL', error.message));
      rsv = data?.[0];
    } else if (email) {
      const { data, error } = await supabaseServer.from('rsvps').select('*').eq('email', String(email).trim().toLowerCase()).limit(1);
      if (error) return errorResponse(new AppError('INTERNAL', error.message));
      rsv = data?.[0];
    } else {
      return errorResponse(AppError.validation('id or email required'));
    }

    if (!rsv) return errorResponse(AppError.notFound('RSVP'));

    // Generate token
    const crypto = await import('crypto');
    const token = crypto.randomBytes(20).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expires_at = new Date(Date.now() + 1000 * 60 * 60).toISOString(); // 1 hour

    const { error: insertErr } = await supabaseServer.from('rsvp_tokens').insert({ 
      rsvp_id: rsv.id, 
      token_hash: tokenHash, 
      purpose: 'edit', 
      expires_at 
    });
    if (insertErr) return errorResponse(new AppError('INTERNAL', insertErr.message));

    return NextResponse.json({ ok: true, token });
  } catch (err: unknown) {
    return errorResponse(handleUnknownError(err, 'generate-test-token'));
  }
}
