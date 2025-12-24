require('dotenv').config({ path: '.env.local' });
const { slidingWindowLimit } = require('../src/lib/ratelimit');
(async ()=>{
  try {
    const k = `rl:sw:test:${Date.now()}`;
    const r = await slidingWindowLimit(k, 3, 60*1000);
    console.log('sliding result', r);
    process.exit(0);
  } catch (e) { console.error(e); process.exit(1); }
})();