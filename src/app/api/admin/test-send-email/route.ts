import { NextResponse } from 'next/server';
import { sendMailAsync } from '../../../../lib/mail';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { password, to } = body as { password?: string; to?: string };
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    const target = to || process.env.TEST_TO_EMAIL || process.env.FROM_EMAIL;
    if (!target) return NextResponse.json({ error: 'no recipient configured' }, { status: 400 });

    // schedule async send and return immediately
    sendMailAsync({ to: target, subject: 'Test email from deployed site', text: 'This is a verification test email.' });
    return NextResponse.json({ ok: true, queued: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}
