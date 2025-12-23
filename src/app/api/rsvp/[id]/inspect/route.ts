import { NextResponse } from 'next/server';

// Inspect route removed — was added for local debugging during development
export async function GET() {
  return NextResponse.json({ error: 'inspect route removed' }, { status: 404 });
}
