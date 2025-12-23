import { Redis } from '@upstash/redis';

// Create a Redis client from env. Upstash supports REST-style url+token; if a full REDIS_URL with password
// is provided, attempt to derive a usable URL/token pair.
// Prefer explicit Upstash REST variables (KV_REST_API_URL / KV_REST_API_TOKEN) when available
const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_TOKEN;

let redis: Redis | null = null;
if (process.env.NODE_ENV !== 'production') console.log('rateLimit init, envs:', { REDIS_URL, REDIS_TOKEN, KV_REST_API_URL: process.env.KV_REST_API_URL, KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN });

if (REDIS_URL && REDIS_TOKEN) {
  redis = new Redis({ url: REDIS_URL, token: REDIS_TOKEN });
} else if (REDIS_URL) {
  // Try to parse user:pass@host style URL to find token
  try {
    const u = new URL(REDIS_URL);
    const token = u.password || REDIS_TOKEN;
    // Upstash expects an HTTPS REST URL (not redis:// or rediss://). Convert if necessary.
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
      // fallback: attempt to use REST-style url if tokenless
      redis = new Redis({ url: restUrl });
    }
  } catch (e) {
    console.error('Could not initialize Upstash Redis client', e);
    redis = null;
  }
}

export async function isRateLimited(key: string, limit: number, windowSeconds: number) {
  if (!redis) return { limited: false, remaining: limit, retryAfter: 0, ok: true };
  // Use simple counter with expiry
  const cur = await redis.incr(key);
  if (cur === 1) await redis.expire(key, windowSeconds);
  const ttl = await redis.ttl(key);
  const remaining = Math.max(0, limit - cur);
  const limited = cur > limit;
  return { limited, remaining, retryAfter: ttl ?? 0, ok: !limited };
}

export async function resetRateLimit(key: string) {
  if (!redis) return;
  await redis.del(key);
}
