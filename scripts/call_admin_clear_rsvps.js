(async function(){
  require('dotenv').config({ path: '.env.local' });
  const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) { console.error('No ADMIN_PASSWORD in env'); process.exit(1); }
  const url = (process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000') + '/api/admin/clear-rsvps';
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw, confirm: 'DELETE' }) });
  const data = await res.json().catch(()=>({}));
  console.log('status', res.status, data);
})();