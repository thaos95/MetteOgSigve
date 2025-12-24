require('dotenv').config({ path: '.env.local' });
const { Redis } = require('@upstash/redis');
(async ()=>{
  try {
    const redis = Redis.fromEnv();
    if (!redis) throw new Error('no redis');
    const key = `rl:sw:direct:${Date.now()}`;
    const now = Date.now();
    const member = `${now}:${Math.random().toString(36).slice(2,8)}`;
    // Try object form
    await redis.zadd(key, { score: now, member });
    await redis.zremrangebyscore(key, 0, now - 60000);
    const count = await redis.zcard(key);
    await redis.pexpire(key, 60000);
    const ttl = await redis.pttl(key);
    console.log({ key, count, ttl });
    process.exit(0);
  } catch (e) { console.error(e); process.exit(1); }
})();