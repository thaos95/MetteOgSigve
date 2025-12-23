require('dotenv').config({ path: '.env.local' });
(async ()=>{
  try {
    const id = '4de9b192-a263-488f-9970-d980359bb5f5';
    const token = '21a58a20dcf9e6500b977197e588b890308d1ec6';
    const body = { name: 'Updated Test User via token', email: 'testx@example.com', attending: true, guests: 1, notes: 'Updated via token', token, adminPassword: process.env.ADMIN_PASSWORD };
    const res = await fetch((process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3001') + `/api/rsvp/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
    const json = await res.json();
    console.log('PUT response status', res.status, json);
  } catch (err) { console.error(err); process.exit(1); }
})();