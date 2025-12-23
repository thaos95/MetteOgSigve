import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export async function GET() {
  // Try to initialize Redis from environment per Upstash docs
  try {
    const redis: any = (Redis as any).fromEnv ? (Redis as any).fromEnv() : new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN });
    if (!redis) return NextResponse.json({ ok: false, error: 'redis not configured' }, { status: 503 });

    const key = `healthcheck:${Date.now()}`;
    // attempt to set key with short TTL and then read it back
    try {
      await redis.set(key, '1', { ex: 5 });
      const val = await redis.get(key);
      if (String(val) === '1') {
        return NextResponse.json({ ok: true, redis: { connected: true } });
      }
      return NextResponse.json({ ok: false, redis: { connected: false, reason: 'unexpected response', val } }, { status: 502 });
    } catch (e: any) {
      return NextResponse.json({ ok: false, redis: { connected: false, error: String(e?.message ?? e) } }, { status: 502 });
    }
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 503 });
  }
}