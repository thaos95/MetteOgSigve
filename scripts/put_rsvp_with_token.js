require('dotenv').config({ path: '.env.local' });
const now = ()=>new Date().toISOString();
const log = (...args)=>console.log('[put_rsvp_with_token]', now(), ...args);
(async ()=>{
  try {
    const id = '4de9b192-a263-488f-9970-d980359bb5f5';
    const token = '21a58a20dcf9e6500b977197e588b890308d1ec6';
    const body = { name: 'Updated Test User via token', email: 'testx@example.com', attending: true, guests: 1, notes: 'Updated via token', token, adminPassword: process.env.ADMIN_PASSWORD };
    let res;
    try {
      res = await fetch((process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3001') + `/api/rsvp/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    } catch (e) {
      log('fetch failed', e.message);
      process.exit(1);
    }
    let json = null;
    try { json = await res.json(); } catch(e) { log('failed to parse JSON body', e.message); }
    log('PUT response status', res.status, json);
  } catch (err) { console.error('[put_rsvp_with_token]', now(), err); process.exit(1); }
})();