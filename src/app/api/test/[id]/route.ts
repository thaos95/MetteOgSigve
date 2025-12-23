import { NextResponse } from 'next/server';

// Test route removed — used to validate dynamic params in dev
export async function GET() {
  return NextResponse.json({ error: 'test route removed' }, { status: 404 });
}
