require('dotenv').config({ path: '.env.local' });
const fetch = globalThis.fetch ? globalThis.fetch.bind(globalThis) : (...args) => import('node-fetch').then(({default:fetch})=>fetch(...args));
(async ()=>{
  try {
    const url = process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000';
    const deviceId = 'test-device-' + Math.random().toString(36).slice(2,8);
    console.log('Using device:', deviceId);
    const base = Date.now();
    for (let i=1;i<=30;i++) {
      const body = { name: 'RL Test ' + i, email: `swtest+${base}+${i}@example.com` };
      const res = await fetch(url + '/api/rsvp', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-device-id': deviceId }, body: JSON.stringify(body) });
      const txt = await res.text();
      console.log('attempt', i, 'status', res.status, txt.slice(0,200));
      if (res.status === 429) break;
      await new Promise(r=>setTimeout(r, 100));
    }
  } catch (e) { console.error(e); process.exit(1); }
})();