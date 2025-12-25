/**
 * Email sending module with support for SMTP (nodemailer) and SendGrid.
 * 
 * Deliverability features:
 * - Proper MIME (text + HTML)
 * - Reply-To header
 * - Connection timeouts
 * - Retry with exponential backoff for transient failures
 * - Structured result reporting
 * 
 * For production deliverability, ensure:
 * - SPF record includes your sending IP/service
 * - DKIM is configured (provider-specific)
 * - From domain aligns with your DKIM/SPF domain
 */

export type SendOptions = {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
  attachments?: Array<{ filename: string; content: string }>;
};

export type SendResult = {
  ok: boolean;
  messageId?: string;
  error?: string;
  provider?: 'smtp' | 'sendgrid';
};

// Connection/socket timeouts to prevent hanging requests
const SMTP_CONNECTION_TIMEOUT = 10000; // 10 seconds
const SMTP_SOCKET_TIMEOUT = 30000; // 30 seconds for slow SMTP servers

async function sleep(ms: number) { 
  return new Promise(r => setTimeout(r, ms)); 
}

/**
 * Check if an error is transient (worth retrying).
 */
function isTransientError(err: any): boolean {
  const msg = String(err?.message || err).toLowerCase();
  // Transient: connection issues, rate limits, temporary failures
  const transientPatterns = [
    'timeout', 'timed out', 'etimedout', 'econnreset', 'econnrefused',
    'enotfound', 'enetunreach', 'socket', 'connection',
    'too many', 'rate limit', 'try again', 'temporary', '421', '450', '451'
  ];
  return transientPatterns.some(p => msg.includes(p));
}

/**
 * Get the base URL for links in emails.
 * Validates that we have a proper URL to avoid broken links.
 */
export function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_VERCEL_URL 
    || process.env.VERCEL_URL 
    || process.env.BASE_URL 
    || '';
  
  // Ensure URL has protocol
  if (url && !url.startsWith('http')) {
    return `https://${url}`;
  }
  return url || 'http://localhost:3000';
}

/**
 * Send an email with retry logic for transient failures.
 * Returns structured result for proper error handling.
 * 
 * Set SKIP_EMAIL_SEND=true in .env.local to skip actual SMTP/SendGrid calls
 * during E2E tests (emails still "succeed" but aren't sent).
 */
export async function sendMail(opts: SendOptions): Promise<SendResult> {
  const maxRetries = 3;
  let attempt = 0;
  let lastErr: any = null;

  const sendgridKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.FROM_EMAIL;
  const replyTo = opts.replyTo || process.env.REPLY_TO_EMAIL || fromEmail;

  if (!fromEmail) {
    return { ok: false, error: 'FROM_EMAIL not configured' };
  }

  // Skip actual email sending in test mode to preserve Gmail rate limits
  // Token generation and DB operations still happen, just no SMTP call
  if (process.env.SKIP_EMAIL_SEND === 'true') {
    console.log('[mail] SKIP_EMAIL_SEND=true, skipping actual send:', { subject: opts.subject, hasRecipient: !!opts.to });
    return { ok: true, messageId: 'skipped-test-mode', provider: 'smtp' };
  }

  // Ensure we have both text and HTML for best deliverability
  const text = opts.text || stripHtml(opts.html || '');
  const html = opts.html || `<pre>${escapeHtml(opts.text || '')}</pre>`;

  while (attempt < maxRetries) {
    try {
      if (sendgridKey) {
        // SendGrid path
        const sgmod = await import('@sendgrid/mail');
        const sg: any = (sgmod && (sgmod as any).default) ? (sgmod as any).default : sgmod;
        sg.setApiKey(sendgridKey);
        
        const m: any = {
          to: opts.to,
          from: fromEmail,
          replyTo: replyTo,
          subject: opts.subject,
          text: text,
          html: html,
        };
        
        // BCC self for debugging
        if (process.env.FEATURE_BCC_SELF === 'true' && fromEmail) {
          m.bcc = fromEmail;
        }
        
        const [sgRes] = await sg.send(m);
        return { 
          ok: true, 
          messageId: sgRes?.headers?.['x-message-id'] || 'sendgrid-sent',
          provider: 'sendgrid'
        };
      } else {
        // Nodemailer SMTP path
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: process.env.SMTP_USER 
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } 
            : undefined,
          // Timeouts to prevent hanging
          connectionTimeout: SMTP_CONNECTION_TIMEOUT,
          socketTimeout: SMTP_SOCKET_TIMEOUT,
          greetingTimeout: SMTP_CONNECTION_TIMEOUT,
        });

        const mailOpts: any = { 
          from: fromEmail,
          to: opts.to,
          replyTo: replyTo,
          subject: opts.subject, 
          text: text, 
          html: html, 
          attachments: opts.attachments,
          // Headers for better deliverability
          headers: {
            'X-Mailer': 'Wedding-RSVP-App',
          }
        };
        
        // BCC self for debugging
        if (process.env.FEATURE_BCC_SELF === 'true' && fromEmail) {
          mailOpts.bcc = fromEmail;
        }
        
        const info = await transporter.sendMail(mailOpts);
        return { 
          ok: true, 
          messageId: info.messageId,
          provider: 'smtp'
        };
      }
    } catch (err: any) {
      lastErr = err;
      attempt += 1;
      
      // Only retry transient errors
      if (!isTransientError(err) || attempt >= maxRetries) {
        break;
      }
      
      const backoff = 500 * Math.pow(2, attempt);
      console.warn(`[mail] Transient error, retrying in ${backoff}ms (attempt ${attempt}/${maxRetries}):`, err.message);
      await sleep(backoff);
    }
  }

  const errorMsg = lastErr?.message ?? String(lastErr);
  console.error('[mail] Send failed after retries:', errorMsg);
  return { ok: false, error: errorMsg };
}

/**
 * Fire-and-forget email send with logging.
 * Use when you don't need to know the result immediately.
 * Note: Failures are only logged, not surfaced to caller.
 */
export function sendMailAsync(opts: SendOptions): void {
  sendMail(opts).then(res => {
    if (!res.ok) {
      // Log failure without sensitive data
      console.error('[mail] Async send failed:', { 
        error: res.error, 
        subject: opts.subject,
        // Don't log recipient email in production
        hasRecipient: !!opts.to 
      });
    } else {
      console.log('[mail] Async send succeeded:', { 
        messageId: res.messageId,
        provider: res.provider,
        subject: opts.subject
      });
    }
  }).catch(e => {
    console.error('[mail] Async send error:', e.message);
  });
}

/**
 * Strip HTML tags for plain text fallback.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

/**
 * Escape HTML for safe embedding in HTML emails.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

