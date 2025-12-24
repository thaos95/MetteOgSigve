require('dotenv').config({ path: './.env.local' });
const fetch = globalThis.fetch ? globalThis.fetch.bind(globalThis) : (...args) => import('node-fetch').then(({default:fetch})=>fetch(...args));
(async ()=>{
  try {
    const url = process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000';
    const res = await fetch(url + '/api/admin/email-rsvps', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: process.env.ADMIN_PASSWORD, to: process.env.FROM_EMAIL, download: true }) });
    console.log('status', res.status);
    const data = await res.json();
    if (data?.csv) {
      console.log('CSV length:', data.csv.length);
      console.log(data.csv.split('\n').slice(0,20).join('\n'));
    } else {
      console.log(data);
    }
  } catch (e) { console.error(e); process.exit(1); }
})();