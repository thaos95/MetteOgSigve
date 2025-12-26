import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabaseServer';

/**
 * Token Verification Endpoint
 * 
 * SIMPLIFIED MODEL (2024):
 * - Only handles edit/cancel tokens
 * - No 'verify' purpose - RSVPs are automatically confirmed on creation
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 });

    // hash incoming token and lookup by token_hash
    const crypto = await import('crypto');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const { data, error } = await supabaseServer.from('rsvp_tokens').select('*, rsvps(*)').eq('token_hash', tokenHash).limit(1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const row = data?.[0];
    if (!row) return NextResponse.json({ error: 'Invalid token' }, { status: 404 });

    const now = new Date();
    if (row.expires_at && new Date(row.expires_at) < now) return NextResponse.json({ error: 'Token expired' }, { status: 410 });

    // For edit/cancel tokens, do not mark token used on lookup — return RSVP for client to use the token for action
    return NextResponse.json({ ok: true, rsvp: row.rsvps, purpose: row.purpose });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}