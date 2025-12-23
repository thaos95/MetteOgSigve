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
        await sg.send(m);
        return { ok: true };
      } else {
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
          secure: (process.env.SMTP_SECURE === 'true') || false,
          auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
        });
        const info = await transporter.sendMail({ from: process.env.FROM_EMAIL as string, to: opts.to as any, subject: opts.subject, text: opts.text, html: opts.html, attachments: opts.attachments });
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
    if (!res?.ok) console.error('sendMailAsync failed', res);
  }).catch(e => console.error('sendMailAsync error', e));
}

