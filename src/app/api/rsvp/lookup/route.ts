import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name') || undefined;
    const email = searchParams.get('email') || undefined;

    if (!name && !email) return NextResponse.json({ error: 'name or email required' }, { status: 400 });

    let query = supabaseServer.from('rsvps').select('id,name,email,attending,guests,notes,created_at');
    if (email) query = query.eq('email', email);
    if (name) query = query.ilike('name', `%${name}%`).limit(5);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ results: data ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
