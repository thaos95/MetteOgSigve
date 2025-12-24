require('dotenv').config({ path: './.env.local' });
const fetch = globalThis.fetch ? globalThis.fetch.bind(globalThis) : (...args) => import('node-fetch').then(({default:fetch})=>fetch(...args));
(async ()=>{
  try {
    const url = process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000';
    const base = Date.now();

    const payload = {
      firstName: 'Ola',
      lastName: `Nordmann${base}`,
      email: `party+${base}@example.com`,
      attending: true,
      party: [{ firstName: 'Kari', lastName: 'Nordmann', attending: true }, { firstName: 'Per', lastName: 'Nordmann', attending: false }],
      notes: 'Test party'
    };

    console.log('Creating initial RSVP');
    const res1 = await fetch(url + '/api/rsvp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    console.log('status', res1.status, await res1.text());

    console.log('Now trying a fuzzy duplicate (first name variation)');
    const payload2 = {...payload, firstName: 'Ola-M', lastName: `Nordmann${base}`};
    const res2 = await fetch(url + '/api/rsvp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload2) });
    console.log('status', res2.status, await res2.text());

    console.log('Now trying to create new anyway with overrideDuplicate');
    const payload3 = {...payload2, overrideDuplicate: true, email: `party+${base}+2@example.com`};
    const res3 = await fetch(url + '/api/rsvp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload3) });
    console.log('status', res3.status, await res3.text());

  } catch (e) { console.error(e); process.exit(1); }
})();