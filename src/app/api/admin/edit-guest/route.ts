import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabaseServer';
import { logAdminAction } from '../../../../lib/adminAudit';
import { editGuestSchema } from '../../../../domain/rsvp/schema';
import { AppError, errorResponse, zodToAppError, handleUnknownError } from '../../../../lib/errors';
import type { ZodError } from 'zod';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate input with Zod schema
    const parseResult = editGuestSchema.safeParse(body);
    if (!parseResult.success) {
      return errorResponse(zodToAppError(parseResult.error as ZodError));
    }
    
    const { password, rsvpId, action, index, firstName, lastName, attending, dir } = parseResult.data;
    
    // Auth check
    if (password !== process.env.ADMIN_PASSWORD) {
      return errorResponse(AppError.unauthorized());
    }

    // Fetch existing RSVP
    const { data: rows, error: fetchErr } = await supabaseServer.from('rsvps').select('*').eq('id', rsvpId).limit(1);
    if (fetchErr) return errorResponse(new AppError('INTERNAL', fetchErr.message));
    const r = rows?.[0];
    if (!r) return errorResponse(AppError.notFound('RSVP'));

    // Parse party array
    let party: any[] = [];
    try { 
      if (Array.isArray(r.party)) party = r.party; 
      else if (r.party && typeof r.party === 'string') party = JSON.parse(r.party); 
    } catch { party = []; }

    // Helper for audit logging
    const logAction = async (actionName: string, before: any, updated: any) => {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin';
      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null;
      const deviceId = req.headers.get('x-device-id') || null;
      await logAdminAction({ adminEmail, action: actionName, targetTable: 'rsvps', targetId: String(rsvpId), before, after: updated, ip, deviceId });
    };

    if (action === 'add') {
      if (!firstName || !lastName) {
        return errorResponse(AppError.validation('firstName and lastName required'));
      }
      const before = { party: JSON.parse(JSON.stringify(party)) };
      party.push({ firstName, lastName, attending: attending ?? true });
      const { error: upErr } = await supabaseServer.from('rsvps').update({ party, updated_at: new Date().toISOString() }).eq('id', rsvpId);
      if (upErr) return errorResponse(new AppError('INTERNAL', upErr.message));
      const { data: updated } = await supabaseServer.from('rsvps').select('*').eq('id', rsvpId).limit(1);
      await logAction('add-guest', before, updated?.[0]);
    } else if (action === 'update') {
      if (index === undefined || index < 0 || index >= party.length) {
        return errorResponse(AppError.validation('invalid index'));
      }
      const before = { party: JSON.parse(JSON.stringify(party)) };
      party[index] = { 
        ...party[index], 
        firstName: firstName ?? party[index].firstName, 
        lastName: lastName ?? party[index].lastName, 
        attending: attending !== undefined ? attending : party[index].attending 
      };
      const { error: upErr } = await supabaseServer.from('rsvps').update({ party, updated_at: new Date().toISOString() }).eq('id', rsvpId);
      if (upErr) return errorResponse(new AppError('INTERNAL', upErr.message));
      const { data: updated } = await supabaseServer.from('rsvps').select('*').eq('id', rsvpId).limit(1);
      await logAction('update-guest', before, updated?.[0]);
    } else if (action === 'remove') {
      if (index === undefined || index < 0 || index >= party.length) {
        return errorResponse(AppError.validation('invalid index'));
      }
      const before = { party: JSON.parse(JSON.stringify(party)) };
      party.splice(index, 1);
      const { error: upErr } = await supabaseServer.from('rsvps').update({ party, updated_at: new Date().toISOString() }).eq('id', rsvpId);
      if (upErr) return errorResponse(new AppError('INTERNAL', upErr.message));
      const { data: updated } = await supabaseServer.from('rsvps').select('*').eq('id', rsvpId).limit(1);
      await logAction('remove-guest', before, updated?.[0]);
    } else if (action === 'move') {
      const direction = dir === 'up' ? -1 : dir === 'down' ? 1 : 0;
      if (index === undefined || index < 0 || index >= party.length || direction === 0) {
        return errorResponse(AppError.validation('invalid move parameters'));
      }
      const newIdx = index + direction;
      if (newIdx < 0 || newIdx >= party.length) {
        return errorResponse(AppError.validation('out of bounds'));
      }
      const before = { party: JSON.parse(JSON.stringify(party)) };
      const item = party.splice(index, 1)[0];
      party.splice(newIdx, 0, item);
      const { error: upErr } = await supabaseServer.from('rsvps').update({ party, updated_at: new Date().toISOString() }).eq('id', rsvpId);
      if (upErr) return errorResponse(new AppError('INTERNAL', upErr.message));
      const { data: updated } = await supabaseServer.from('rsvps').select('*').eq('id', rsvpId).limit(1);
      await logAction('move-guest', before, updated?.[0]);
    }

    const { data: updated } = await supabaseServer.from('rsvps').select('*').eq('id', rsvpId).limit(1);
    return NextResponse.json({ ok: true, rsvp: updated?.[0] });
  } catch (err: unknown) {
    return errorResponse(handleUnknownError(err, 'admin-edit-guest'));
  }
}
