import { Redis } from '@upstash/redis';

// Create a Redis client from env. Upstash supports REST-style url+token; if a full REDIS_URL with password
// is provided, attempt to derive a usable URL/token pair.
// Prefer explicit Upstash REST variables (KV_REST_API_URL / KV_REST_API_TOKEN) when available
const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_TOKEN;

let redis: Redis | null = null;
if (process.env.NODE_ENV !== 'production') console.log('rateLimit init, envs:', { REDIS_URL, REDIS_TOKEN, KV_REST_API_URL: process.env.KV_REST_API_URL, KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN });

function tryInitRedis() {
  if (redis) return redis;
  try {
    if (typeof (Redis as any).fromEnv === 'function') {
      redis = (Redis as any).fromEnv();
    } else if (REDIS_URL && REDIS_TOKEN) {
      redis = new Redis({ url: REDIS_URL, token: REDIS_TOKEN });
    } else if (REDIS_URL) {
      const u = new URL(REDIS_URL);
      const token = u.password || REDIS_TOKEN;
      const proto = u.protocol || '';
      let restUrl: string;
      if (proto.startsWith('rediss:') || proto.startsWith('redis:')) {
        restUrl = REDIS_URL.replace(/^rediss?:\/\//, 'https://');
      } else {
        restUrl = REDIS_URL;
      }
      if (token) {
        redis = new Redis({ url: restUrl, token });
      } else {
        redis = new Redis({ url: restUrl, token: token || undefined } as any);
      }
    }
  } catch (e) {
    console.error('Could not initialize Upstash Redis client', e);
    redis = null;
  }
  return redis;
}

export async function isRateLimited(key: string, limit: number, windowSeconds: number) {
  // Allow bypassing rate limits in dev/testing via env var
  if (process.env.FEATURE_DISABLE_RATE_LIMITS === 'true') return { limited: false, remaining: limit, retryAfter: 0, ok: true };
  if (!redis) return { limited: false, remaining: limit, retryAfter: 0, ok: true };
  // Use simple counter with expiry
  const cur = await redis.incr(key);
  if (cur === 1) await redis.expire(key, windowSeconds);
  const ttl = await redis.ttl(key);
  const remaining = Math.max(0, limit - cur);
  const limited = cur > limit;
  return { limited, remaining, retryAfter: ttl ?? 0, ok: !limited };
}

// Sliding-window implementation using Redis Sorted Sets (ZSET). Uses ms window.
export async function slidingWindowLimit(key: string, limit: number, windowMs: number) {
  if (process.env.FEATURE_DISABLE_RATE_LIMITS === 'true') return { limited: false, remaining: limit, retryAfter: 0, ok: true, count: 0 };
  tryInitRedis();
  if (!redis) return { limited: false, remaining: limit, retryAfter: 0, ok: true, count: 0 };
  const now = Date.now();
  const member = `${now}:${Math.random().toString(36).slice(2,8)}`;
  try {
    // Add current timestamp as score & member (Upstash zadd supports object form)
    await redis.zadd(key, { score: now, member });
    // Remove old entries outside the window
    await redis.zremrangebyscore(key, 0, now - windowMs);
    // Get count (current window size)
    const count = await redis.zcard(key);
    // Ensure key will expire after windowMs to allow automatic cleanup
    await redis.pexpire(key, windowMs);
    const ttl = await redis.pttl(key);
    const limited = count > limit;
    if (process.env.NODE_ENV !== 'production') console.log('slidingWindowLimit', JSON.stringify({ key, limit, windowMs, count, ttl, limited }));
    return { limited, remaining: Math.max(0, limit - count), retryAfter: Math.ceil((ttl ?? 0) / 1000), ok: !limited, count };
  } catch (e) {
    console.error('slidingWindowLimit error', e);
    return { limited: false, remaining: limit, retryAfter: 0, ok: true, count: 0 };
  }
}

export async function getSlidingCount(key: string) {
  if (!redis) return { count: 0, ttl: -1 };
  try {
    const count = await redis.zcard(key);
    const ttl = await redis.pttl(key);
    return { count, ttl };
  } catch (e) {
    console.error('getSlidingCount error', e);
    return { count: 0, ttl: -1 };
  }
}

export async function resetRateLimit(key: string) {
  if (!redis) return;
  await redis.del(key);
}
