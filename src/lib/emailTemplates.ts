/**
 * Wedding Email Templates
 * 
 * Modern, table-based HTML email templates that:
 * - Work across all major email clients
 * - Include both HTML and plain-text versions
 * - Use inline styles only
 * - Gracefully degrade when images are blocked
 * 
 * Design principles:
 * - Warm, elegant, inviting tone
 * - Mobile-first (max-width 600px)
 * - Clear hierarchy: header → content → CTA → footer
 * - Practical: all important info visible immediately
 */

import { weddingConfig, formatAddress } from './weddingConfig';
import { getBaseUrl } from './mail';

// Brand colors (matching wedding site)
const colors = {
  primary: '#4a5a4a',      // Sage green
  accent: '#8b9d83',       // Lighter sage
  text: '#3d3d3d',         // Dark gray
  textMuted: '#6b6b6b',    // Muted gray
  background: '#faf9f7',   // Warm cream
  cardBg: '#ffffff',       // White
  border: '#e8e6e3',       // Soft border
  button: '#4a5a4a',       // Button background
  buttonText: '#ffffff',   // Button text
};

// Font stack (system fonts for email compatibility)
const fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const fontFamilySerif = "Georgia, 'Times New Roman', Times, serif";

/**
 * Shared email layout wrapper
 */
function emailLayout(content: string, options: { preheader?: string } = {}): string {
  const baseUrl = getBaseUrl();
  const { preheader = '' } = options;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${weddingConfig.couple.displayName}</title>
  <!--[if mso]>
  <style type="text/css">
    table { border-collapse: collapse; }
    .fallback-font { font-family: Arial, sans-serif; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: ${colors.background}; font-family: ${fontFamily}; -webkit-font-smoothing: antialiased;">
  ${preheader ? `<div style="display: none; max-height: 0; overflow: hidden;">${preheader}</div>` : ''}
  
  <!-- Main container -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${colors.background};">
    <tr>
      <td align="center" style="padding: 24px 16px;">
        
        <!-- Email card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: ${colors.cardBg}; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid ${colors.border};">
              <h1 style="margin: 0; font-family: ${fontFamilySerif}; font-size: 28px; font-weight: normal; color: ${colors.primary}; letter-spacing: 0.5px;">
                ${weddingConfig.couple.displayName}
              </h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: ${colors.textMuted};">
                ${weddingConfig.date.full}
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: ${colors.background}; border-top: 1px solid ${colors.border}; border-radius: 0 0 8px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 8px; font-size: 14px; color: ${colors.textMuted};">
                      Questions? Visit our <a href="${baseUrl}/travel" style="color: ${colors.primary}; text-decoration: underline;">Travel & Info</a> page
                    </p>
                    <p style="margin: 0; font-size: 13px; color: ${colors.textMuted};">
                      With love, ${weddingConfig.couple.emailSignature}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Create a CTA button (bulletproof for email clients)
 */
function ctaButton(text: string, href: string, options: { secondary?: boolean } = {}): string {
  const bgColor = options.secondary ? 'transparent' : colors.button;
  const textColor = options.secondary ? colors.primary : colors.buttonText;
  const border = options.secondary ? `2px solid ${colors.primary}` : 'none';
  
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px auto;">
      <tr>
        <td align="center" style="background-color: ${bgColor}; border-radius: 6px; border: ${border};">
          <a href="${href}" target="_blank" style="display: inline-block; padding: 14px 28px; font-family: ${fontFamily}; font-size: 16px; font-weight: 500; color: ${textColor}; text-decoration: none;">
            ${text}
          </a>
        </td>
      </tr>
    </table>`;
}

/**
 * Event details section (ceremony + venue)
 */
function eventDetailsSection(): string {
  const { ceremony, venue, date } = weddingConfig;
  
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <!-- Ceremony -->
      <tr>
        <td style="padding: 16px; background-color: ${colors.background}; border-radius: 6px; margin-bottom: 12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-bottom: 8px;">
                <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: ${colors.accent}; font-weight: 600;">Ceremony</span>
              </td>
            </tr>
            <tr>
              <td>
                <p style="margin: 0 0 4px; font-size: 16px; font-weight: 600; color: ${colors.primary};">${ceremony.time} · ${ceremony.nameNorwegian}</p>
                <p style="margin: 0 0 8px; font-size: 14px; color: ${colors.textMuted};">${formatAddress(ceremony)}</p>
                <a href="${ceremony.mapsUrl}" style="font-size: 13px; color: ${colors.primary}; text-decoration: underline;">View on Google Maps →</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr><td style="height: 12px;"></td></tr>
      <!-- Venue -->
      <tr>
        <td style="padding: 16px; background-color: ${colors.background}; border-radius: 6px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-bottom: 8px;">
                <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: ${colors.accent}; font-weight: 600;">Celebration</span>
              </td>
            </tr>
            <tr>
              <td>
                <p style="margin: 0 0 4px; font-size: 16px; font-weight: 600; color: ${colors.primary};">${venue.time} · ${venue.name}</p>
                <p style="margin: 0 0 8px; font-size: 14px; color: ${colors.textMuted};">${formatAddress(venue)}</p>
                <a href="${venue.mapsUrl}" style="font-size: 13px; color: ${colors.primary}; text-decoration: underline;">View on Google Maps →</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
}

// ============================================
// EMAIL TEMPLATES
// ============================================

export interface RsvpData {
  name: string;
  attending: boolean;
  guestList: string;
  notes?: string;
}

/**
 * RSVP Verification Email
 * Sent after RSVP submission to verify email ownership
 */
export function verificationEmail(data: { name: string; verifyLink: string; rsvpSummary: RsvpData }) {
  const { name, verifyLink, rsvpSummary } = data;
  const baseUrl = getBaseUrl();
  
  const html = emailLayout(`
    <p style="margin: 0 0 16px; font-size: 16px; color: ${colors.text};">
      Hi ${name},
    </p>
    
    <p style="margin: 0 0 24px; font-size: 16px; color: ${colors.text}; line-height: 1.6;">
      Thank you for your RSVP! Please verify your email address to confirm your response.
    </p>
    
    ${ctaButton('Verify My RSVP', verifyLink)}
    
    <p style="margin: 24px 0 0; font-size: 13px; color: ${colors.textMuted}; text-align: center;">
      This link expires in 1 hour. If you didn't submit this RSVP, you can safely ignore this email.
    </p>
    
    <!-- RSVP Summary -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0 0; border-top: 1px solid ${colors.border}; padding-top: 24px;">
      <tr>
        <td>
          <p style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: ${colors.primary};">Your RSVP Summary</p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="font-size: 14px; color: ${colors.text};">
            <tr>
              <td style="padding: 4px 16px 4px 0; color: ${colors.textMuted};">Response:</td>
              <td style="padding: 4px 0; font-weight: 500;">${rsvpSummary.attending ? '✓ Attending' : '✗ Unable to attend'}</td>
            </tr>
            ${rsvpSummary.attending && rsvpSummary.guestList ? `
            <tr>
              <td style="padding: 4px 16px 4px 0; color: ${colors.textMuted};">Guests:</td>
              <td style="padding: 4px 0;">${rsvpSummary.guestList}</td>
            </tr>` : ''}
            ${rsvpSummary.notes ? `
            <tr>
              <td style="padding: 4px 16px 4px 0; color: ${colors.textMuted}; vertical-align: top;">Notes:</td>
              <td style="padding: 4px 0;">${rsvpSummary.notes}</td>
            </tr>` : ''}
          </table>
        </td>
      </tr>
    </table>
    
    <!-- Event Details -->
    ${eventDetailsSection()}
    
    <!-- Practical Info -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
      <tr>
        <td>
          <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: ${colors.primary};">Practical Information</p>
          <ul style="margin: 0; padding: 0 0 0 20px; font-size: 14px; color: ${colors.text}; line-height: 1.8;">
            <li>Please arrive at the church by 12:15</li>
            <li>The venue is about 45 min drive from the church</li>
            <li>Parking is available at both locations</li>
          </ul>
          <p style="margin: 12px 0 0;">
            <a href="${baseUrl}/travel" style="font-size: 14px; color: ${colors.primary}; text-decoration: underline;">View all travel & accommodation info →</a>
          </p>
        </td>
      </tr>
    </table>
  `, { preheader: `Thanks for your RSVP! Please verify your email to confirm.` });
  
  const text = `Hi ${name},

Thank you for your RSVP! Please verify your email address by visiting:
${verifyLink}

This link expires in 1 hour.

YOUR RSVP SUMMARY
-----------------
Response: ${rsvpSummary.attending ? 'Attending' : 'Unable to attend'}
${rsvpSummary.attending && rsvpSummary.guestList ? `Guests: ${rsvpSummary.guestList}` : ''}
${rsvpSummary.notes ? `Notes: ${rsvpSummary.notes}` : ''}

THE WEDDING
-----------
${weddingConfig.date.full}

Ceremony at ${weddingConfig.ceremony.time}
${weddingConfig.ceremony.nameNorwegian}
${formatAddress(weddingConfig.ceremony)}
Maps: ${weddingConfig.ceremony.mapsUrl}

Celebration from ${weddingConfig.venue.time}
${weddingConfig.venue.name}
${formatAddress(weddingConfig.venue)}
Maps: ${weddingConfig.venue.mapsUrl}

PRACTICAL INFO
--------------
• Please arrive at the church by 12:15
• The venue is about 45 min drive from the church
• Parking is available at both locations

More info: ${baseUrl}/travel

With love,
${weddingConfig.couple.emailSignature}`;

  return {
    subject: `${weddingConfig.email.subjectPrefix} — Please verify your RSVP`,
    html,
    text,
  };
}

/**
 * Edit/Cancel Token Email
 * Sent when user requests a secure link to edit or cancel their RSVP
 */
export function tokenEmail(data: { name: string; link: string; purpose: 'edit' | 'cancel' }) {
  const { name, link, purpose } = data;
  const actionText = purpose === 'cancel' ? 'cancel' : 'edit';
  const buttonText = purpose === 'cancel' ? 'Cancel My RSVP' : 'Edit My RSVP';
  
  const html = emailLayout(`
    <p style="margin: 0 0 16px; font-size: 16px; color: ${colors.text};">
      Hi ${name},
    </p>
    
    <p style="margin: 0 0 24px; font-size: 16px; color: ${colors.text}; line-height: 1.6;">
      You requested a secure link to ${actionText} your RSVP. Click the button below to continue.
    </p>
    
    ${ctaButton(buttonText, link)}
    
    <p style="margin: 24px 0 0; font-size: 13px; color: ${colors.textMuted}; text-align: center;">
      This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
    </p>
  `, { preheader: `Your secure link to ${actionText} your RSVP` });
  
  const text = `Hi ${name},

You requested a secure link to ${actionText} your RSVP.

${buttonText}: ${link}

This link expires in 1 hour. If you didn't request this, you can safely ignore this email.

With love,
${weddingConfig.couple.emailSignature}`;

  return {
    subject: `${weddingConfig.email.subjectPrefix} — Your RSVP ${actionText} link`,
    html,
    text,
  };
}

/**
 * RSVP Updated Confirmation Email
 * Sent after an RSVP is successfully updated
 */
export function updateConfirmationEmail(data: { name: string; rsvpSummary: RsvpData }) {
  const { name, rsvpSummary } = data;
  const baseUrl = getBaseUrl();
  
  const html = emailLayout(`
    <p style="margin: 0 0 16px; font-size: 16px; color: ${colors.text};">
      Hi ${name},
    </p>
    
    <p style="margin: 0 0 24px; font-size: 16px; color: ${colors.text}; line-height: 1.6;">
      Your RSVP has been updated successfully. Here's your updated response:
    </p>
    
    <!-- RSVP Summary -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding: 16px; background-color: ${colors.background}; border-radius: 6px;">
      <tr>
        <td>
          <table role="presentation" cellpadding="0" cellspacing="0" style="font-size: 14px; color: ${colors.text};">
            <tr>
              <td style="padding: 4px 16px 4px 0; color: ${colors.textMuted};">Response:</td>
              <td style="padding: 4px 0; font-weight: 500;">${rsvpSummary.attending ? '✓ Attending' : '✗ Unable to attend'}</td>
            </tr>
            ${rsvpSummary.attending && rsvpSummary.guestList ? `
            <tr>
              <td style="padding: 4px 16px 4px 0; color: ${colors.textMuted};">Guests:</td>
              <td style="padding: 4px 0;">${rsvpSummary.guestList}</td>
            </tr>` : ''}
            ${rsvpSummary.notes ? `
            <tr>
              <td style="padding: 4px 16px 4px 0; color: ${colors.textMuted}; vertical-align: top;">Notes:</td>
              <td style="padding: 4px 0;">${rsvpSummary.notes}</td>
            </tr>` : ''}
          </table>
        </td>
      </tr>
    </table>
    
    <p style="margin: 24px 0 0; font-size: 14px; color: ${colors.textMuted};">
      Need to make another change? You can request a new edit link from the <a href="${baseUrl}/rsvp" style="color: ${colors.primary}; text-decoration: underline;">RSVP page</a>.
    </p>
  `, { preheader: `Your RSVP has been updated successfully.` });
  
  const text = `Hi ${name},

Your RSVP has been updated successfully.

YOUR UPDATED RSVP
-----------------
Response: ${rsvpSummary.attending ? 'Attending' : 'Unable to attend'}
${rsvpSummary.attending && rsvpSummary.guestList ? `Guests: ${rsvpSummary.guestList}` : ''}
${rsvpSummary.notes ? `Notes: ${rsvpSummary.notes}` : ''}

Need to make another change? Visit: ${baseUrl}/rsvp

With love,
${weddingConfig.couple.emailSignature}`;

  return {
    subject: `${weddingConfig.email.subjectPrefix} — RSVP updated`,
    html,
    text,
  };
}

/**
 * RSVP Cancelled Confirmation Email
 * Sent after an RSVP is cancelled
 */
export function cancelConfirmationEmail(data: { name: string }) {
  const { name } = data;
  const baseUrl = getBaseUrl();
  
  const html = emailLayout(`
    <p style="margin: 0 0 16px; font-size: 16px; color: ${colors.text};">
      Hi ${name},
    </p>
    
    <p style="margin: 0 0 24px; font-size: 16px; color: ${colors.text}; line-height: 1.6;">
      Your RSVP has been cancelled. We're sorry you won't be able to join us, but we understand and appreciate you letting us know.
    </p>
    
    <p style="margin: 0; font-size: 14px; color: ${colors.textMuted};">
      If your plans change, you can always submit a new RSVP at <a href="${baseUrl}/rsvp" style="color: ${colors.primary}; text-decoration: underline;">${baseUrl}/rsvp</a>
    </p>
  `, { preheader: `Your RSVP has been cancelled.` });
  
  const text = `Hi ${name},

Your RSVP has been cancelled. We're sorry you won't be able to join us, but we understand and appreciate you letting us know.

If your plans change, you can always submit a new RSVP at:
${baseUrl}/rsvp

With love,
${weddingConfig.couple.emailSignature}`;

  return {
    subject: `${weddingConfig.email.subjectPrefix} — RSVP cancelled`,
    html,
    text,
  };
}
