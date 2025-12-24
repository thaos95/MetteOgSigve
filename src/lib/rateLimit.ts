import { Redis } from '@upstash/redis';
import { AppError } from './errors';

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

// ============================================================================
// Rate Limit Presets (Centralized Configuration)
// ============================================================================

/**
 * Rate limit configuration presets.
 * These match the limits defined in the abuse mitigation plan.
 */
export const RATE_LIMIT_PRESETS = {
  // RSVP submission
  rsvp: {
    device: {
      limit: Number(process.env.RL_SW_RSVP_DEVICE_LIMIT || 10),
      windowMs: Number(process.env.RL_RSVP_WINDOW || 86400) * 1000, // 1 day
      keyPrefix: 'rl:sw:rsvp:device:',
    },
    ip: {
      limit: Number(process.env.RL_SW_RSVP_IP_LIMIT || 200),
      windowMs: Number(process.env.RL_RSVP_WINDOW || 86400) * 1000,
      keyPrefix: 'rl:sw:rsvp:ip:',
    },
    email: {
      limit: Number(process.env.RL_SW_RSVP_EMAIL_LIMIT || 5),
      windowMs: Number(process.env.RL_RSVP_WINDOW || 86400) * 1000,
      keyPrefix: 'rl:sw:rsvp:email:',
    },
  },
  // Token requests
  token: {
    device: {
      limit: Number(process.env.RL_SW_TOKEN_DEVICE_LIMIT || 10),
      windowMs: Number(process.env.RL_TOKEN_REQ_WINDOW || 3600) * 1000, // 1 hour
      keyPrefix: 'rl:sw:token:device:',
    },
    ip: {
      limit: Number(process.env.RL_SW_TOKEN_IP_LIMIT || 50),
      windowMs: Number(process.env.RL_TOKEN_REQ_WINDOW || 3600) * 1000,
      keyPrefix: 'rl:sw:token:ip:',
    },
    email: {
      limit: Number(process.env.RL_SW_TOKEN_EMAIL_LIMIT || 5),
      windowMs: Number(process.env.RL_TOKEN_REQ_WINDOW || 3600) * 1000,
      keyPrefix: 'rl:sw:token:email:',
    },
  },
} as const;

/**
 * Apply standard rate limits for RSVP creation.
 * Throws AppError.rateLimited if any limit is exceeded.
 */
export async function applyRsvpRateLimits(context: {
  ip: string;
  deviceId: string;
  email?: string | null;
}): Promise<void> {
  const { ip, deviceId, email } = context;
  const p = RATE_LIMIT_PRESETS.rsvp;

  // Device limit
  const deviceResult = await slidingWindowLimit(
    `${p.device.keyPrefix}${deviceId}`,
    p.device.limit,
    p.device.windowMs
  );
  if (deviceResult.limited) {
    throw AppError.rateLimited(deviceResult.retryAfter, 'device');
  }

  // IP limit
  const ipResult = await slidingWindowLimit(
    `${p.ip.keyPrefix}${ip}`,
    p.ip.limit,
    p.ip.windowMs
  );
  if (ipResult.limited) {
    throw AppError.rateLimited(ipResult.retryAfter, 'ip');
  }

  // Email limit (if email provided)
  if (email) {
    const emailResult = await slidingWindowLimit(
      `${p.email.keyPrefix}${email}`,
      p.email.limit,
      p.email.windowMs
    );
    if (emailResult.limited) {
      throw AppError.rateLimited(emailResult.retryAfter, 'email');
    }
  }
}

/**
 * Apply standard rate limits for token requests.
 * Returns { escalate: true } if device limit is exceeded but should try CAPTCHA.
 * Throws AppError.rateLimited if IP or email limits exceeded.
 */
export async function applyTokenRateLimits(context: {
  ip: string;
  deviceId: string;
  email?: string | null;
  isVerified?: boolean;
}): Promise<{ escalate: boolean }> {
  const { ip, deviceId, email, isVerified } = context;
  const p = RATE_LIMIT_PRESETS.token;

  // Device limit - escalate to CAPTCHA instead of hard block
  const deviceResult = await slidingWindowLimit(
    `${p.device.keyPrefix}${deviceId}`,
    p.device.limit,
    p.device.windowMs
  );
  const escalate = deviceResult.limited;

  // IP limit - hard block
  const ipResult = await slidingWindowLimit(
    `${p.ip.keyPrefix}${ip}`,
    p.ip.limit,
    p.ip.windowMs
  );
  if (ipResult.limited) {
    throw AppError.rateLimited(ipResult.retryAfter, 'ip');
  }

  // Email limit - verified users get 2x limit
  if (email) {
    const emailLimit = isVerified ? p.email.limit * 2 : p.email.limit;
    const emailResult = await slidingWindowLimit(
      `${p.email.keyPrefix}${email}`,
      emailLimit,
      p.email.windowMs
    );
    if (emailResult.limited) {
      throw AppError.rateLimited(emailResult.retryAfter, 'email');
    }
  }

  return { escalate };
}

/**
 * Extract rate limit context from request.
 */
export function getRateLimitContext(req: Request, body?: { deviceId?: string }) {
  return {
    ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || req.headers.get('x-real-ip')
        || 'unknown',
    deviceId: req.headers.get('x-device-id')
        || body?.deviceId
        || 'unknown-device',
  };
}
