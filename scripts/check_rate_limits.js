require('dotenv').config({ path: '.env.local' });
const { Redis } = require('@upstash/redis');
(async ()=>{
  try {
    const redis = (Redis.fromEnv) ? Redis.fromEnv() : new Redis({ url: process.env.KV_REST_API_URL || process.env.REDIS_URL, token: process.env.KV_REST_API_TOKEN || process.env.REDIS_TOKEN });
    if (!redis) { console.error('Redis not configured'); process.exit(1); }
    const email = process.env.EMAIL_TO_CHECK || process.env.TEST_TO_EMAIL || process.env.FROM_EMAIL;
    if (!email) { console.error('No email configured (set EMAIL_TO_CHECK or TEST_TO_EMAIL or FROM_EMAIL)'); process.exit(1); }
    const e = String(email).trim().toLowerCase();
    const keys = [ `rl:rsvp:email:${e}`, `rl:tok:req:email:${e}` ];
    for (const k of keys) {
      const val = await redis.get(k);
      const ttl = await redis.ttl(k);
      console.log(k, 'value=', val, 'ttl=', ttl);
    }
    process.exit(0);
  } catch (e) { console.error(e); process.exit(1); }
})();