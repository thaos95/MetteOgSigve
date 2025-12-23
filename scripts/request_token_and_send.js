require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const now = ()=>new Date().toISOString();
const log = (...args)=>console.log('[request_token_and_send]', now(), ...args);
(async ()=>{
  try {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const connectionString = process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL_NON_POOLING;
    if (!connectionString) throw new Error('POSTGRES_URL not set');
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();

    // Ensure an RSVP exists
    let res = await client.query(`select id,name,email from public.rsvps limit 1`);
    if (!res.rows.length) {
      const name = 'Test Guest';
      const email = process.env.TEST_RSVP_EMAIL || 'test+rsvp@example.com';
      await client.query('insert into public.rsvps(id, name, email, attending, guests, notes, created_at) values (gen_random_uuid(), $1, $2, true, 0, $3, now())', [name, email, 'Inserted by test script']);
      res = await client.query(`select id,name,email from public.rsvps limit 1`);
    }
    const r = res.rows[0];
    log('Using RSVP:', r);

    const token = crypto.randomBytes(20).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expires_at = new Date(Date.now()+1000*60*60).toISOString();

    await client.query('insert into public.rsvp_tokens(rsvp_id, token_hash, purpose, expires_at) values($1,$2,$3,$4)', [r.id, tokenHash, 'edit', expires_at]);
    log('Inserted token (raw):', token);

    // Send email via nodemailer using SMTP config
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: (process.env.SMTP_SECURE === 'true'),
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });

    const link = `${process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000'}/rsvp?token=${token}`;
    const mailOptions = {
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: r.email,
      subject: 'Mette & Sigve — RSVP secure link (test)',
      text: `Open your RSVP: ${link}`,
      html: `<p>Hi ${r.name},</p><p>Open your RSVP: <a href="${link}">${link}</a></p>`
    };

    let info;
    try {
      info = await transport.sendMail(mailOptions);
      log('Email send result:', info && (info.accepted || info.response) ? 'sent' : info);
    } catch (e) {
      log('Email send failed:', e.message);
    }

    // verify token exists
    const tRes = await client.query('select id,rsvp_id,token_hash,purpose,used,expires_at from public.rsvp_tokens where token_hash=$1', [tokenHash]);
    if (!tRes || !tRes.rows || !tRes.rows[0]) {
      log('Token row not found for tokenHash');
    } else {
      log('Token row:', tRes.rows[0]);
    }

    await client.end();
    process.exit(0);
  } catch (err) { console.error('[request_token_and_send]', now(), err); process.exit(1); }
})();