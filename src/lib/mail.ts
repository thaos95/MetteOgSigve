type SendOptions = {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{ filename: string; content: string }>
}

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

export async function sendMail(opts: SendOptions) {
  const maxRetries = 3;
  let attempt = 0;
  let lastErr: any = null;

  // Prefer SendGrid if API key available
  const sendgridKey = process.env.SENDGRID_API_KEY;

  while (attempt < maxRetries) {
    try {
      if (sendgridKey) {
        const sgmod = await import('@sendgrid/mail');
        const sg: any = (sgmod && (sgmod as any).default) ? (sgmod as any).default : sgmod;
        sg.setApiKey(sendgridKey);
        const m = {
          to: opts.to,
          from: process.env.FROM_EMAIL as string,
          subject: opts.subject,
          text: opts.text,
          html: opts.html,
        } as any;
        // Optionally BCC a copy to the configured from address for debugging
        if (process.env.FEATURE_BCC_SELF === 'true' && process.env.FROM_EMAIL) m.bcc = process.env.FROM_EMAIL;
        // SendGrid may return a response or an array of responses depending on input
        const sgRes = await sg.send(m);
        return { ok: true, info: { sendgrid: sgRes } };
      } else {
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
          secure: (process.env.SMTP_SECURE === 'true') || false,
          auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
        });
        const mailOpts: any = { from: process.env.FROM_EMAIL as string, to: opts.to as any, subject: opts.subject, text: opts.text, html: opts.html, attachments: opts.attachments };
        if (process.env.FEATURE_BCC_SELF === 'true' && process.env.FROM_EMAIL) mailOpts.bcc = process.env.FROM_EMAIL;
        const info = await transporter.sendMail(mailOpts);
        return { ok: true, info };
      }
    } catch (err: any) {
      lastErr = err;
      attempt += 1;
      const backoff = 500 * Math.pow(2, attempt);
      await sleep(backoff);
    }
  }

  return { ok: false, error: lastErr?.message ?? String(lastErr) };
}

// Non-blocking wrapper: call sendMail but don't await in the request path
export function sendMailAsync(opts: SendOptions) {
  // Fire-and-forget while ensuring errors are logged
  sendMail(opts).then(res => {
    if (!res?.ok) {
      console.error('sendMailAsync failed', res);
    } else {
      // Log success to make async sends observable during testing
      try {
        if (process.env.NODE_ENV !== 'production') {
          try {
            console.log('sendMailAsync succeeded (raw):', JSON.stringify(res, null, 2));
          } catch (e) {
            console.log('sendMailAsync succeeded (non-serializable):', res);
          }
        } else {
          console.log('sendMailAsync queued', { to: opts.to, subject: opts.subject });
        }
      } catch (e) {
        console.log('sendMailAsync succeeded (result present)');
      }
    }
  }).catch(e => console.error('sendMailAsync error', e));
}

