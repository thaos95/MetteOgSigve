# Email Deliverability Runbook

Production guide for RSVP email deliverability.

## Overview

The wedding site sends transactional emails for:
1. **Verification emails** – Confirm RSVP email ownership
2. **Token emails** – Secure links to edit/cancel RSVPs  
3. **Confirmation emails** – Updates after RSVP changes
4. **Admin test emails** – Verify email configuration

---

## Current Architecture

### Email Providers

| Provider | Transport | When Used |
|----------|-----------|-----------|
| **Gmail SMTP** | nodemailer | Default (`SMTP_HOST=smtp.gmail.com`) |
| **SendGrid** | SendGrid API | If `SENDGRID_API_KEY` is set |

### Environment Variables

```bash
# SMTP Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false  # STARTTLS on port 587
SMTP_USER=youruser@gmail.com
SMTP_PASS=your-app-password   # Generate at myaccount.google.com/apppasswords

# From Address
FROM_EMAIL=youruser@gmail.com
REPLY_TO_EMAIL=reply@yourdomain.com  # Optional, defaults to FROM_EMAIL

# SendGrid (optional, takes priority if set)
SENDGRID_API_KEY=SG.xxx...

# URL for email links
NEXT_PUBLIC_VERCEL_URL=your-app.vercel.app

# Features
FEATURE_BCC_SELF=true  # BCC FROM_EMAIL for debugging
```

---

## Deliverability Improvements (Implemented)

### 1. Connection Timeouts ✅
- Connection timeout: 10 seconds
- Socket timeout: 30 seconds
- Prevents hung requests from blocking the API

### 2. Smart Retry Logic ✅
- Retries up to 3 times for transient failures
- Exponential backoff: 1s, 2s, 4s
- Does NOT retry permanent failures (invalid recipient, auth error)

### 3. Proper MIME Structure ✅
- Always sends both `text/plain` and `text/html` parts
- Auto-generates text from HTML if not provided
- Improves spam filtering scores

### 4. Reply-To Header ✅
- Set via `REPLY_TO_EMAIL` env var
- Falls back to `FROM_EMAIL`
- Helps with domain alignment

### 5. Consistent Link Generation ✅
- All email links use `getBaseUrl()` helper
- Handles missing protocol (adds https://)
- Priority: `NEXT_PUBLIC_VERCEL_URL` → `VERCEL_URL` → `BASE_URL` → localhost

---

## DNS Configuration (Required for Production)

### SPF Record

Add a TXT record for your domain:

```
v=spf1 include:_spf.google.com ~all
```

For SendGrid:
```
v=spf1 include:sendgrid.net include:_spf.google.com ~all
```

### DKIM

**Gmail SMTP**: Limited DKIM support. Emails are signed with Gmail's domain, which causes alignment issues when sending from a custom `FROM_EMAIL`.

**SendGrid**: Set up DKIM in the SendGrid dashboard under Settings → Sender Authentication.

### DMARC

Add a TXT record at `_dmarc.yourdomain.com`:

```
v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
```

Start with `p=none` to monitor, then move to `p=quarantine` or `p=reject`.

---

## Gmail SMTP Limitations

| Issue | Impact | Mitigation |
|-------|--------|------------|
| Domain mismatch | DKIM/SPF alignment fails | Use Google Workspace or switch to SendGrid |
| Daily sending limit | ~500/day (consumer), ~2000/day (Workspace) | Use SendGrid for higher volume |
| App passwords required | No OAuth in server context | Generate at myaccount.google.com/apppasswords |
| No custom DKIM | Can't sign with your domain | Use SendGrid for custom domain signing |

### Recommendation for Production

**For best deliverability**, use SendGrid or another transactional email provider:

1. Register at sendgrid.com
2. Add your sending domain
3. Configure domain authentication (DKIM, SPF)
4. Get API key and set `SENDGRID_API_KEY`

---

## Monitoring & Troubleshooting

### Check Logs

```bash
# Vercel logs
vercel logs --follow

# Look for:
# [mail] Send failed after retries: <error>
# [mail] Async send succeeded: { messageId: ... }
# [mail] Transient error, retrying in ...
```

### Test Email Delivery

1. Use the admin test endpoint:
   ```bash
   curl -X POST https://your-site.vercel.app/api/admin/test-send-email \
     -H "Content-Type: application/json" \
     -d '{"password":"<admin-password>","email":"test@example.com"}'
   ```

2. Check spam folder if not in inbox

3. Check email headers for:
   - SPF: `pass` or `neutral`
   - DKIM: `pass` (may fail with Gmail SMTP)
   - Authentication-Results header

### Common Issues

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| Emails in spam | SPF/DKIM failure | Configure DNS records |
| Emails not arriving | Rate limit or auth error | Check logs, verify credentials |
| "Connection timeout" errors | SMTP server unreachable | Check firewall, try SendGrid |
| "Invalid login" | Wrong app password | Generate new app password |
| Links don't work | Missing `NEXT_PUBLIC_VERCEL_URL` | Set the env var |

### Email Testing Tools

- **Mail-tester.com** – Check spam score (send test email to their address)
- **MXToolbox** – DNS record checker
- **Google Postmaster** – Delivery stats for Gmail recipients

---

## Security Considerations

### Token Handling
- Tokens are hashed (SHA256) before storing in database
- Raw tokens only sent in emails, never logged in production
- Tokens expire after 1 hour

### PII Protection
- Email addresses not logged in production
- Only `hasRecipient: true/false` logged for debugging
- Subject line logged for debugging (contains no PII)

### Rate Limiting
- Per-device sliding window (10 requests/hour)
- Per-IP sliding window (50 requests/hour)
- Per-email sliding window (5-10 requests/hour depending on verification)
- CAPTCHA escalation when limits exceeded

---

## Quick Checklist

**Before Go-Live:**

- [ ] `FROM_EMAIL` set to a verified email address
- [ ] `NEXT_PUBLIC_VERCEL_URL` set to production domain
- [ ] SPF record configured for sending domain
- [ ] Test email received in inbox (not spam)
- [ ] Rate limiting configured (Upstash Redis)

**For Best Deliverability:**

- [ ] Switch to SendGrid or similar ESP
- [ ] Configure domain authentication (DKIM)
- [ ] Set up DMARC monitoring
- [ ] Use custom domain for `FROM_EMAIL` (not gmail.com)

---

## API Reference

### `sendMail(options): Promise<SendResult>`

Synchronous email send with retry logic.

```typescript
const result = await sendMail({
  to: 'recipient@example.com',
  subject: 'Subject line',
  html: '<p>HTML content</p>',  // Auto-generates text
  text: 'Plain text',           // Auto-wraps in HTML if html omitted
  replyTo: 'reply@example.com', // Optional
});

if (!result.ok) {
  console.error('Send failed:', result.error);
}
```

### `sendMailAsync(options): void`

Fire-and-forget send. Use when you don't need to wait for result.

```typescript
sendMailAsync({
  to: email,
  subject: 'Your RSVP',
  html: '<p>Thanks for RSVPing!</p>',
});
// Returns immediately, logs result
```

### `getBaseUrl(): string`

Get the base URL for email links.

```typescript
const link = `${getBaseUrl()}/rsvp?token=${token}`;
// Returns: https://your-app.vercel.app/rsvp?token=abc123
```

---

## Version History

| Date | Change |
|------|--------|
| 2024-12-25 | Initial runbook created |
| 2024-12-25 | Added SMTP timeouts, retry logic, Reply-To header |
| 2024-12-25 | Added `getBaseUrl()` helper for consistent link generation |
| 2024-12-25 | Added mail module unit tests |
