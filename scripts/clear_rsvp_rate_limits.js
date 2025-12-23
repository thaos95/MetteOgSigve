require('dotenv').config({ path: '.env.local' });
const { Redis } = require('@upstash/redis');
(async ()=>{
  try {
    const redis = Redis.fromEnv();
    const keys = await redis.keys('rl:rsvp:*');
    console.log('Found keys to remove:', keys.length, keys);
    for (const k of keys) {
      await redis.del(k);
      console.log('Deleted', k);
    }
    // Also clear token req keys
    const keys2 = await redis.keys('rl:tok:req:*');
    console.log('Found token request keys to remove:', keys2.length, keys2);
    for (const k of keys2) {
      await redis.del(k);
      console.log('Deleted', k);
    }
    process.exit(0);
  } catch (e) { console.error('Error clearing keys', e); process.exit(1); }
})();