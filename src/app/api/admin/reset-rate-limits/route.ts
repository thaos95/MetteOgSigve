import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { logAdminAction } from '../../../../lib/adminAudit';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { password, email, all } = body as { password?: string; email?: string; all?: boolean };
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const redis = (Redis as any).fromEnv ? (Redis as any).fromEnv() : new Redis({ url: process.env.KV_REST_API_URL || process.env.REDIS_URL, token: process.env.KV_REST_API_TOKEN || process.env.REDIS_TOKEN });
    if (!redis) return NextResponse.json({ error: 'redis not configured' }, { status: 500 });

    const adminEmail = process.env.ADMIN_EMAIL || 'admin';
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null;
    const deviceId = req.headers.get('x-device-id') || null;

    if (email && (body as any).view) {
      const e = String(email).trim().toLowerCase();
      // fetch and return counts for known sliding keys
      const swKeys = [ `rl:sw:token:email:${e}`, `rl:sw:rsvp:email:${e}` ];
      const results: Record<string, any> = {};
      for (const k of swKeys) {
        try {
          const count = await redis.zcard(k);
          const ttl = await redis.pttl(k);
          results[k] = { count, ttl };
        } catch (err) {
          results[k] = { error: String(err) };
        }
      }
      // also include legacy simple counters if present
      const legacyKeys = [ `rl:rsvp:email:${e}`, `rl:tok:req:email:${e}` ];
      for (const k of legacyKeys) {
        try {
          const val = await redis.get(k);
          const ttl = await redis.ttl(k);
          results[k] = { value: val, ttl };
        } catch (err) {
          results[k] = { error: String(err) };
        }
      }
      return NextResponse.json({ ok: true, results });
    }

    if (email) {
      const e = String(email).trim().toLowerCase();
      const keys = [ `rl:rsvp:email:${e}`, `rl:tok:req:email:${e}`, `rl:sw:token:email:${e}`, `rl:sw:rsvp:email:${e}` ];
      const deleted: string[] = [];
      for (const k of keys) {
        const exists = await redis.get(k);
        if (exists !== null) {
          await redis.del(k);
          deleted.push(k);
        }
      }
      // Audit log
      await logAdminAction({ adminEmail, action: 'reset-rate-limits', targetTable: 'rate-limits', targetId: e, before: { keys }, after: { cleared: deleted }, ip, deviceId });
      return NextResponse.json({ ok: true, cleared: deleted });
    }

    if (all) {
      // REMOVE ALL rate-limit keys (use with caution)
      const keys = await redis.keys('rl:*');
      for (const k of keys) await redis.del(k);
      // Audit log
      await logAdminAction({ adminEmail, action: 'reset-all-rate-limits', targetTable: 'rate-limits', targetId: 'ALL', before: { keyCount: keys.length }, after: null, ip, deviceId });
      return NextResponse.json({ ok: true, clearedCount: keys.length });
    }

    if (email === undefined && (body as any).view) {
      return NextResponse.json({ error: 'provide email to view counters' }, { status: 400 });
    }

    return NextResponse.json({ error: 'provide email or set all=true' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}
