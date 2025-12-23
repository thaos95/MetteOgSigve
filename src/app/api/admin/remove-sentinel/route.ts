import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const password = body?.password;
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const fs = await import('fs');
    const sentinel = '.create_rsvps_done';
    if (!fs.existsSync(sentinel)) {
      return NextResponse.json({ ok: true, message: 'Sentinel not present' });
    }

    try {
      fs.unlinkSync(sentinel);
      return NextResponse.json({ ok: true, message: 'Sentinel removed' });
    } catch (e: any) {
      return NextResponse.json({ error: String(e) }, { status: 500 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
