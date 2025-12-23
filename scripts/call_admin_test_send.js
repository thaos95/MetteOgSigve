require('dotenv').config({ path: '.env.local' });
const fetch = globalThis.fetch ? globalThis.fetch.bind(globalThis) : (...args) => import('node-fetch').then(({default:fetch})=>fetch(...args));
(async ()=>{
  try {
    const url = process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000';
    const res = await fetch(url + '/api/admin/test-send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: process.env.ADMIN_PASSWORD, to: process.env.TEST_TO_EMAIL || process.env.FROM_EMAIL }) });
    console.log('status', res.status, await res.json().catch(()=>null));
    process.exit(0);
  } catch (e) { console.error(e); process.exit(1); }
})();