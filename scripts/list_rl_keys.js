require('dotenv').config({ path: '.env.local' });
const { Redis } = require('@upstash/redis');
(async ()=>{
  try {
    const redis = (Redis.fromEnv) ? Redis.fromEnv() : new Redis({ url: process.env.KV_REST_API_URL || process.env.REDIS_URL, token: process.env.KV_REST_API_TOKEN || process.env.REDIS_TOKEN });
    if (!redis) { console.error('Redis not configured'); process.exit(1); }
    const keys = await redis.keys('rl:*');
    console.log('Found keys:', keys.length);
    for (const k of keys) {
      try {
        const type = await redis.type(k);
        let info;
        if (type === 'zset') {
          info = { count: await redis.zcard(k), ttl: await redis.pttl(k) };
        } else {
          info = { value: await redis.get(k), ttl: await redis.ttl(k) };
        }
        console.log(k, type, info);
      } catch (e) {
        console.error('err for', k, e);
      }
    }
    process.exit(0);
  } catch (e) { console.error(e); process.exit(1); }
})();