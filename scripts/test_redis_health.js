require('dotenv').config({ path: '.env.local' });
const fetch = globalThis.fetch ? globalThis.fetch.bind(globalThis) : (...args) => import('node-fetch').then(({default:fetch})=>fetch(...args));
(async ()=>{
  try {
    const url = process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000';
    const res = await fetch(url + '/api/status/redis');
    const json = await res.json().catch(()=>null);
    console.log('status code', res.status, json);
    process.exit(0);
  } catch (e) { console.error(e); process.exit(1); }
})();