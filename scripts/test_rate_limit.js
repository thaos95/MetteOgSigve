require('dotenv').config({ path: '.env.local' });
const now = ()=>new Date().toISOString();
const log = (...args)=>console.log('[test_rate_limit]', now(), ...args);
(async ()=>{
  try {
    const { Redis } = require('@upstash/redis');
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_TOKEN;
    if (!url) throw new Error('Upstash REST URL not set (KV_REST_API_URL or UPSTASH_REDIS_REST_URL)');
    // Ensure URL is https for upstash REST client
    const restUrl = url.startsWith('rediss://') || url.startsWith('redis://') ? url.replace(/^rediss?:\/\//, 'https://') : url;
    const redis = token ? new Redis({ url: restUrl, token }) : new Redis({ url: restUrl });
    const key = 'rl:test:js';
    const limit = 3;
    const window = 5;
    for (let i = 0; i < 6; i++) {
      try {
        const cur = await redis.incr(key);
        if (cur === 1) await redis.expire(key, window);
        log('count', cur);
      } catch (e) {
        log('redis operation failed on iteration', i, e.message);
      }
      await new Promise(r => setTimeout(r, 200));
    }
    try { await redis.del(key); } catch(e){ log('failed to delete key', e.message); }
    process.exit(0);
  } catch (err) { console.error('[test_rate_limit]', now(), err); process.exit(1); }
})();