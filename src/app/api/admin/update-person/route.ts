import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabaseServer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const password = body?.password;
    if (!password || password !== process.env.ADMIN_PASSWORD) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const rsvpId = body?.rsvpId;
    const target = body?.target; // 'primary' or index number for party
    const attending = body?.attending;
    if (!rsvpId) return NextResponse.json({ error: 'rsvpId required' }, { status: 400 });
    if (attending === undefined) return NextResponse.json({ error: 'attending required' }, { status: 400 });

    const { data: rows, error: fetchErr } = await supabaseServer.from('rsvps').select('*').eq('id', rsvpId).limit(1);
    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    const r = rows?.[0];
    if (!r) return NextResponse.json({ error: 'rsvp not found' }, { status: 404 });

    let party: any[] = [];
    try {
      if (Array.isArray(r.party)) party = r.party;
      else if (r.party && typeof r.party === 'string') party = JSON.parse(r.party);
    } catch (e) { party = []; }

    if (target === 'primary') {
      // toggle primary attending field
      const { error: up } = await supabaseServer.from('rsvps').update({ attending: !!attending, updated_at: new Date().toISOString() }).eq('id', rsvpId).select('*');
      if (up) return NextResponse.json({ error: up.message }, { status: 500 });
      const { data: updated } = await supabaseServer.from('rsvps').select('*').eq('id', rsvpId).limit(1);
      return NextResponse.json({ ok: true, rsvp: updated?.[0] });
    }

    // expect numeric index
    const idx = Number.isFinite(Number(target)) ? Number(target) : null;
    if (idx === null || idx < 0 || idx >= party.length) return NextResponse.json({ error: 'invalid target index' }, { status: 400 });

    party[idx].attending = !!attending;

    const { error: upErr } = await supabaseServer.from('rsvps').update({ party, updated_at: new Date().toISOString() }).eq('id', rsvpId).select('*');
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

    const { data: updated } = await supabaseServer.from('rsvps').select('*').eq('id', rsvpId).limit(1);
    return NextResponse.json({ ok: true, rsvp: updated?.[0] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}