# Email Templates Documentation

This document describes the email template system for the wedding site.

## Overview

The email system has been redesigned to provide a warm, elegant, and practical experience for guests. All transactional emails now include:

- **Wedding details** (date, time, locations)
- **Google Maps links** for both ceremony and venue
- **Table-based HTML layout** for maximum email client compatibility
- **Both HTML and plain-text versions** for accessibility
- **Mobile-responsive design** (max-width 600px)
- **Inline styles only** (no external CSS that could be blocked)

## Architecture

```
src/lib/
├── weddingConfig.ts     # Centralized wedding event data
├── emailTemplates.ts    # Email template functions
├── mail.ts              # SMTP sending logic
└── __tests__/
    └── emailTemplates.test.ts  # Unit tests
```

## Email Types

### 1. Verification Email (`verificationEmail`)
**Trigger:** After RSVP submission or resend verification request
**Subject:** `Mette & Sigve — Please verify your RSVP`
**Content includes:**
- Personalized greeting
- CTA button to verify email
- RSVP summary (attending status, guests, notes)
- Full event details with Google Maps links
- Practical info (arrival time, parking, drive time)

### 2. Edit/Cancel Token Email (`tokenEmail`)
**Trigger:** When user requests a secure link to edit or cancel RSVP
**Subject:** `Mette & Sigve — Your RSVP edit/cancel link`
**Content includes:**
- Clear purpose (edit vs cancel)
- CTA button with secure token
- Expiration notice (1 hour)

### 3. Update Confirmation Email (`updateConfirmationEmail`)
**Trigger:** After RSVP is successfully updated
**Subject:** `Mette & Sigve — RSVP updated`
**Content includes:**
- Confirmation message
- Updated RSVP details
- Link to request another edit

### 4. Cancel Confirmation Email (`cancelConfirmationEmail`)
**Trigger:** After RSVP is cancelled
**Subject:** `Mette & Sigve — RSVP cancelled`
**Content includes:**
- Warm, understanding tone
- Option to submit new RSVP

## Updating Wedding Details

All wedding event data is centralized in `src/lib/weddingConfig.ts`:

```typescript
export const weddingConfig = {
  couple: {
    name1: 'Sigve',
    name2: 'Mette',
    displayName: 'Mette & Sigve',
    emailSignature: 'Mette & Sigve',
  },
  date: {
    full: 'Friday, 3rd of July 2026',
    short: '3 July 2026',
    iso: '2026-07-03',
  },
  ceremony: {
    name: 'Botne Church',
    nameNorwegian: 'Botne kirke',
    time: '12:30',
    address: { street: 'Kirkeveien 19', postalCode: '3085', city: 'Holmestrand' },
    mapsUrl: 'https://maps.google.com/?q=...',
  },
  venue: {
    name: 'Midtåsen',
    time: '14:30',
    address: { street: 'Midtåsveien 2A', postalCode: '3226', city: 'Sandefjord' },
    mapsUrl: 'https://maps.google.com/?q=...',
  },
  email: {
    subjectPrefix: 'Mette & Sigve',
    couplePhoto: '/Mette og Sigve/IMG_8170.jpeg',
  },
};
```

To change wedding details, update this file. All emails will automatically use the new values.

## Design Tokens

The email templates use a consistent color palette:

| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#4a5a4a` | Sage green - headers, buttons |
| `accent` | `#8b9d83` | Lighter sage - labels |
| `text` | `#3d3d3d` | Body text |
| `textMuted` | `#6b6b6b` | Secondary text |
| `background` | `#faf9f7` | Warm cream background |
| `cardBg` | `#ffffff` | Card backgrounds |
| `border` | `#e8e6e3` | Subtle borders |

## Testing

Run the email template tests:

```bash
npx vitest run src/lib/__tests__/emailTemplates.test.ts
```

The tests verify:
- Wedding date appears in all verification emails
- Ceremony and venue details are included
- Google Maps links are present
- RSVP summary is displayed
- Both HTML and plain-text versions work
- Table-based layout is used
- Inline styles only (no external CSS)

## Environment Variables

The email system uses these environment variables:

| Variable | Description |
|----------|-------------|
| `SMTP_HOST` | SMTP server (e.g., `smtp.gmail.com`) |
| `SMTP_PORT` | Port (typically `587` for TLS) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password / app password |
| `SENDGRID_API_KEY` | Alternative: SendGrid API key |
| `SKIP_EMAIL_SEND` | Set to `true` in tests to skip sending |
| `MAIL_FROM` | From address (e.g., `noreply@mette-og-sigve.no`) |
| `BASE_URL` | Site URL for links (e.g., `https://mette-og-sigve.no`) |

## Email Client Compatibility

The templates are designed to work across:
- Gmail (web & mobile)
- Apple Mail
- Outlook (desktop & web)
- Yahoo Mail
- Mobile email clients

Key compatibility features:
- Table-based layout (`role="presentation"`)
- Inline styles only
- System fonts (no web fonts)
- MSO conditional comments for Outlook
- Bulletproof buttons
- Preheader text for preview

## Future Enhancements

Potential improvements:
- [ ] Add couple photo to verification email
- [ ] Localization (Norwegian/English)
- [ ] Reminder emails before the wedding
- [ ] Thank you emails after RSVP verification
