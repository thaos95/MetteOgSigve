require('dotenv').config({ path: '.env.local' });
const fetch = globalThis.fetch ? globalThis.fetch.bind(globalThis) : (...args) => import('node-fetch').then(({default:fetch})=>fetch(...args));
(async ()=>{
  try {
    const url = process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000';
    for (let i=1;i<=15;i++) {
      const res = await fetch(url + '/api/rsvp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'RL Test ' + i }) });
      console.log(i, res.status);
      if (res.status === 429) { console.log('Rate limited at', i); break; }
    }
    process.exit(0);
  } catch (e) { console.error(e); process.exit(1); }
})();