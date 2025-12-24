require('dotenv').config({ path: '.env.local' });
const fetch = globalThis.fetch ? globalThis.fetch.bind(globalThis) : (...args) => import('node-fetch').then(({default:fetch})=>fetch(...args));
(async ()=>{
  try {
    const url = process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000';
    const email = process.env.TEST_TO_EMAIL || process.env.FROM_EMAIL || 'test@example.com';
    for (let i=1;i<=10;i++) {
      const body = { email };
      const res = await fetch(url + '/api/rsvp/request-token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const txt = await res.text();
      console.log('attempt', i, 'status', res.status, txt);
      if (res.status === 429) break;
      await new Promise(r=>setTimeout(r, 200));
    }
  } catch (e) { console.error(e); process.exit(1); }
})();