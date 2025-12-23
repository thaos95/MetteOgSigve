require('dotenv').config({ path: '.env.local' });
const fetch = globalThis.fetch ? globalThis.fetch.bind(globalThis) : (...args) => import('node-fetch').then(({default:fetch})=>fetch(...args));
const now = ()=>new Date().toISOString();
const log = (...args)=>console.log('[test_rsvp_rate_limit]', now(), ...args);
(async ()=>{
  try {
    const url = process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000';
    for (let i=1;i<=15;i++) {
      const body = { name: 'RL Test ' + i };
      // Include a dummy recaptcha token for local enforcement
      body.recaptchaToken = 'test-token';
      let res;
      try {
        res = await fetch(url + '/api/rsvp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      } catch (e) {
        log('fetch failed for attempt', i, e.message);
        await new Promise(r=>setTimeout(r, 200));
        continue;
      }
      let bodyText = null;
      try { bodyText = await res.text(); } catch (e) { /* ignore */ }
      log('attempt', i, 'status', res.status, bodyText ? bodyText.slice(0,200) : '');
      if (res.status === 429) { log('Rate limited at', i); break; }
      await new Promise(r=>setTimeout(r, 200));
    }
    process.exit(0);
  } catch (e) { console.error('[test_rsvp_rate_limit]', now(), e); process.exit(1); }
})();