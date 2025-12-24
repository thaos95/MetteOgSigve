import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";

function csvEscape(value: any) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (s.includes('"') || s.includes(',') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const password = body?.password;
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // Apply optional filters: attending (all|yes|no), from/to dates (ISO)
    const attending = body?.attending; // 'all' | 'yes' | 'no'
    const from = body?.from; const to = body?.to;

    // By default only include verified RSVPs; allow admin to include unverified by setting include_unverified = true
    const includeUnverified = !!body?.include_unverified;
    let q = supabaseServer.from('rsvps').select('*');
    if (!includeUnverified) q = q.eq('verified', true);
    if (attending === 'yes') q = q.eq('attending', true);
    if (attending === 'no') q = q.eq('attending', false);
    if (from) q = q.gte('created_at', from);
    if (to) q = q.lte('created_at', to);
    q = q.order('created_at', { ascending: false });

    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const rows = data ?? [];

    const includePartyRows = !!body?.include_party_rows;
    const personNameFilter = body?.person_name ? String(body.person_name).trim().toLowerCase() : null;
    const personAttendingFilter = body?.person_attending ?? null; // 'yes'|'no'

    if (includePartyRows || personNameFilter || personAttendingFilter) {
      // Flatten to per-person rows similar to email-rsvps
      const headers = ['rsvp_id','rsvp_name','rsvp_email','person_role','person_first','person_last','person_attending','rsvp_attending','notes','created_at'];
      const flatRows: any[] = [];
      for (const r of rows) {
        const rsvpId = r.id;
        const rsvpName = r.name || `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim();
        const rsvpEmail = r.email || '';
        const rsvpAttending = !!r.attending;
        const createdAt = r.created_at;
        const notes = r.notes ?? '';

        // primary
        const primaryFirst = r.first_name || (r.name ? String(r.name).split(/\s+/)[0] : '');
        const primaryLast = r.last_name || (r.name ? String(r.name).split(/\s+/).slice(-1).join(' ') : '');
        flatRows.push({ rsvp_id: rsvpId, rsvp_name: rsvpName, rsvp_email: rsvpEmail, person_role: 'primary', person_first: primaryFirst, person_last: primaryLast, person_attending: rsvpAttending, rsvp_attending: rsvpAttending, notes, created_at: createdAt });

        // party members
        let party = [];
        try {
          if (Array.isArray(r.party)) party = r.party;
          else if (r.party && typeof r.party === 'string') party = JSON.parse(r.party);
        } catch (e) { party = []; }
        if (Array.isArray(party)) {
          for (const p of party) {
            const pf = p.firstName || p.first_name || '';
            const pl = p.lastName || p.last_name || '';
            const pa = p.attending !== undefined ? !!p.attending : rsvpAttending;
            flatRows.push({ rsvp_id: rsvpId, rsvp_name: rsvpName, rsvp_email: rsvpEmail, person_role: 'guest', person_first: pf, person_last: pl, person_attending: pa, rsvp_attending: rsvpAttending, notes, created_at: createdAt });
          }
        }
      }

      // Filter by person name / attending
      const filtered = flatRows.filter(fr => {
        if (personNameFilter) {
          const nameMatch = String(fr.person_first || '').toLowerCase().includes(personNameFilter) || String(fr.person_last || '').toLowerCase().includes(personNameFilter) || String(fr.rsvp_name || '').toLowerCase().includes(personNameFilter);
          if (!nameMatch) return false;
        }
        if (personAttendingFilter === 'yes' && !fr.person_attending) return false;
        if (personAttendingFilter === 'no' && fr.person_attending) return false;
        return true;
      });

      const csv = [headers.join(',')].concat(filtered.map(r => headers.map(h => csvEscape(r[h])).join(','))).join('\n');
      const res = new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="rsvps_per_person.csv"'
        }
      });
      return res;
    }

    const headers = ['id','name','email','attending','guests','notes','created_at'];
    const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => csvEscape(r[h])).join(','))).join('\n');

    const res = new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="rsvps.csv"'
      }
    });

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
