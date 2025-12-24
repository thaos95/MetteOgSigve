const fetch = globalThis.fetch || require('node-fetch');
const base = process.env.BASE_URL || 'http://localhost:3000';
(async ()=>{
  try {
    const ts = Date.now();
    const payload = { firstName: 'AuditTest', lastName: `Party${ts}`, email: `audit+${ts}@example.com`, attending: false, party: [] };
    console.log('Creating RSVP...');
    const deviceId = 'test-audit-' + ts;
    const create = await fetch(base + '/api/rsvp', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-device-id': deviceId }, body: JSON.stringify(payload) });
    if (!create.ok) throw new Error('Create failed: ' + (await create.text()));
    const created = await create.json();
    const rsvpId = created.rsvp.id;
    console.log('Created rsvp:', rsvpId);

    // Call edit-guest add
    console.log('Calling admin edit-guest add...');
    const add = await fetch(base + '/api/admin/edit-guest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: process.env.ADMIN_PASSWORD || 'metteogsigve', rsvpId, action: 'add', firstName: 'NewG', lastName: 'Added', attending: true }) });
    if (!add.ok) throw new Error('Add guest failed: ' + (await add.text()));
    console.log('Add guest ok');

    // Fetch audit logs
    const logs = await fetch(base + '/api/admin/audit-logs?password=' + encodeURIComponent(process.env.ADMIN_PASSWORD || 'metteogsigve') + '&targetId=' + encodeURIComponent(rsvpId));
    if (!logs.ok) throw new Error('Failed to fetch logs: ' + (await logs.text()));
    const js = await logs.json();
    console.log('Found logs:', js.logs.length);
    if (!Array.isArray(js.logs) || js.logs.length < 1) throw new Error('No logs written');

    const hasAdd = js.logs.some(l => l.action === 'add-guest');
    if (!hasAdd) throw new Error('add-guest action not found in logs');

    console.log('Audit log test passed');
    process.exit(0);
  } catch (e) {
    console.error('Test failed:', e);
    process.exit(2);
  }
})();
