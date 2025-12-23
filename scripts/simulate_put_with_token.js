require('dotenv').config({ path: '.env.local' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
const { Client } = require('pg');
const nodemailer = require('nodemailer');
const now = ()=>new Date().toISOString();
const log = (...args)=>console.log('[simulate_put_with_token]', now(), ...args);
(async ()=>{
  try {
    const client = new Client({ connectionString: process.env.POSTGRES_URL, ssl: { rejectUnauthorized: false } });
    await client.connect();

    const id = '4de9b192-a263-488f-9970-d980359bb5f5';
    const token = '21a58a20dcf9e6500b977197e588b890308d1ec6';

    // fetch token
    const tk = await client.query('select * from public.rsvp_tokens where token=$1 and rsvp_id=$2 limit 1', [token, id]);
    if (!tk.rows.length) throw new Error('token not found');
    const row = tk.rows[0];
    if (row.used) throw new Error('token already used');
    if (row.expires_at && new Date(row.expires_at) < new Date()) throw new Error('token expired');

    // perform update
    await client.query("update public.rsvps set name=$1, email=$2, attending=$3, guests=$4, notes=$5, updated_at=now() where id=$6", ['Updated via simulate', 'testx@example.com', true, 1, 'Simulated update via token', id]);

    // mark token used
    await client.query('update public.rsvp_tokens set used=true where id=$1', [row.id]);

    // send email
    const transport = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: (process.env.SMTP_SECURE === 'true'), auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined });
    try {
      const info = await transport.sendMail({ from: process.env.FROM_EMAIL || process.env.SMTP_USER, to: 'testx@example.com', subject: 'RSVP updated (simulated)', text: 'Your RSVP was updated.' });
      log('Email send info:', info && (info.accepted || info.response) ? 'sent' : info);
    } catch (e) { log('Email send failed (expected in many cases):', e.message); }

    // confirm updates
    const r = await client.query('select id,name,email,notes from public.rsvps where id=$1', [id]);
    const t = await client.query('select id,token,used from public.rsvp_tokens where id=$1', [row.id]);
    log('rsvp now:', r.rows[0]);
    log('token now:', t.rows[0]);
    await client.end();
    process.exit(0);
  } catch (err) { console.error('[simulate_put_with_token]', now(), err.message || err); process.exit(1); }
})();