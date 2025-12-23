require('dotenv').config({ path: '.env.local' });
(async ()=>{
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('SENDGRID_API_KEY not set in env; set it in .env.local for testing');
      process.exit(0);
    }
    const sgmod = await import('@sendgrid/mail');
    const sg = (sgmod && sgmod.default) ? sgmod.default : sgmod;
    sg.setApiKey(process.env.SENDGRID_API_KEY);
    const to = process.env.TEST_TO_EMAIL || process.env.FROM_EMAIL || 'you@example.com';
    const res = await sg.send({ to, from: process.env.FROM_EMAIL || to, subject: 'SendGrid test', text: 'Test from scripts/test_sendgrid_send.js' });
    console.log('SendGrid send result:', res);
    process.exit(0);
  } catch (e) { console.error('SendGrid test failed:', e); process.exit(1); }
})();