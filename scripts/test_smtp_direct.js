require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');
(async ()=>{
  try {
    const to = process.env.TEST_TO_EMAIL || process.env.FROM_EMAIL;
    if (!to) return console.error('Set TEST_TO_EMAIL or FROM_EMAIL in .env.local to test SMTP');
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = (process.env.SMTP_SECURE === 'true');
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!host || !user || !pass) return console.error('SMTP_HOST/SMTP_USER/SMTP_PASS not set in .env.local');
    const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
    console.log('Attempting SMTP send to', to, 'via', host, port, 'secure=', secure);
    const info = await transporter.sendMail({ from: process.env.FROM_EMAIL || user, to, subject: 'SMTP direct test', text: 'SMTP direct test from scripts/test_smtp_direct.js' });
    console.log('Direct SMTP send result:', info);
    process.exit(0);
  } catch (e) { console.error('Direct SMTP test failed:', e); process.exit(1); }
})();