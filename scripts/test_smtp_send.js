require('dotenv').config({ path: '.env.local' });
(async ()=>{
  try {
    const to = process.env.TEST_TO_EMAIL || process.env.FROM_EMAIL;
    if (!to) return console.error('Set TEST_TO_EMAIL or FROM_EMAIL in .env.local to test SMTP');
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return console.error('SMTP_HOST/SMTP_USER/SMTP_PASS not set in .env.local');
    const mod = await import('../src/lib/mail');
    const sendMail = mod.sendMail;
    if (typeof sendMail !== 'function') return console.error('sendMail helper not available');
    console.log('Testing SMTP send to', to);
    const res = await sendMail({ to, subject: 'SMTP test', text: 'Test email from scripts/test_smtp_send.js' });
    console.log('sendMail result:', res);
    process.exit(0);
  } catch (e) { console.error('SMTP test failed:', e); process.exit(1); }
})();