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
                      Spørsmål? Besøk vår <a href="${baseUrl}/travel" style="color: ${colors.primary}; text-decoration: underline;">Reise & Info</a> side
                    </p>
                    <p style="margin: 0; font-size: 13px; color: ${colors.textMuted};">
                      Hilsen, ${weddingConfig.couple.emailSignature}
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
                <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: ${colors.accent}; font-weight: 600;">Vielse</span>
              </td>
            </tr>
            <tr>
              <td>
                <p style="margin: 0 0 4px; font-size: 16px; font-weight: 600; color: ${colors.primary};">${ceremony.time} · ${ceremony.nameNorwegian}</p>
                <p style="margin: 0 0 8px; font-size: 14px; color: ${colors.textMuted};">${formatAddress(ceremony)}</p>
                <a href="${ceremony.mapsUrl}" style="font-size: 13px; color: ${colors.primary}; text-decoration: underline;">Se på Google Maps →</a>
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
                <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: ${colors.accent}; font-weight: 600;">Feiring</span>
              </td>
            </tr>
            <tr>
              <td>
                <p style="margin: 0 0 4px; font-size: 16px; font-weight: 600; color: ${colors.primary};">${venue.time} · ${venue.name}</p>
                <p style="margin: 0 0 8px; font-size: 14px; color: ${colors.textMuted};">${formatAddress(venue)}</p>
                <a href="${venue.mapsUrl}" style="font-size: 13px; color: ${colors.primary}; text-decoration: underline;">Se på Google Maps →</a>
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
      Hei ${name},
    </p>
    
    <p style="margin: 0 0 24px; font-size: 16px; color: ${colors.text}; line-height: 1.6;">
      Takk for ditt svar! Vennligst bekreft e-postadressen din for å fullføre registreringen.
    </p>
    
    ${ctaButton('Bekreft mitt svar', verifyLink)}
    
    <p style="margin: 24px 0 0; font-size: 13px; color: ${colors.textMuted}; text-align: center;">
      Denne lenken utløper om 1 time. Hvis du ikke sendte dette svaret, kan du trygt ignorere denne e-posten.
    </p>
    
    <!-- RSVP Summary -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0 0; border-top: 1px solid ${colors.border}; padding-top: 24px;">
      <tr>
        <td>
          <p style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: ${colors.primary};">Oppsummering av ditt svar</p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="font-size: 14px; color: ${colors.text};">
            <tr>
              <td style="padding: 4px 16px 4px 0; color: ${colors.textMuted};">Svar:</td>
              <td style="padding: 4px 0; font-weight: 500;">${rsvpSummary.attending ? '✓ Kommer' : '✗ Kan ikke komme'}</td>
            </tr>
            ${rsvpSummary.attending && rsvpSummary.guestList ? `
            <tr>
              <td style="padding: 4px 16px 4px 0; color: ${colors.textMuted};">Gjester:</td>
              <td style="padding: 4px 0;">${rsvpSummary.guestList}</td>
            </tr>` : ''}
            ${rsvpSummary.notes ? `
            <tr>
              <td style="padding: 4px 16px 4px 0; color: ${colors.textMuted}; vertical-align: top;">Melding:</td>
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
          <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: ${colors.primary};">Praktisk informasjon</p>
          <ul style="margin: 0; padding: 0 0 0 20px; font-size: 14px; color: ${colors.text}; line-height: 1.8;">
            <li>Vennligst møt opp ved kirken senest kl. 12:15</li>
            <li>Det tar ca. 30-35 minutter å kjøre fra kirken til festlokalet</li>
            <li>Parkering er tilgjengelig på begge steder</li>
          </ul>
          <p style="margin: 12px 0 0;">
            <a href="${baseUrl}/travel" style="font-size: 14px; color: ${colors.primary}; text-decoration: underline;">Se all informasjon om reise og overnatting →</a>
          </p>
        </td>
      </tr>
    </table>
  `, { preheader: `Takk for ditt svar! Vennligst bekreft e-posten din.` });
  
  const text = `Hei ${name},

Takk for ditt svar! Vennligst bekreft e-postadressen din ved å besøke:
${verifyLink}

Denne lenken utløper om 1 time.

OPPSUMMERING AV DITT SVAR
-----------------
Svar: ${rsvpSummary.attending ? 'Kommer' : 'Kan ikke komme'}
${rsvpSummary.attending && rsvpSummary.guestList ? `Gjester: ${rsvpSummary.guestList}` : ''}
${rsvpSummary.notes ? `Melding: ${rsvpSummary.notes}` : ''}

BRYLLUPET
-----------
${weddingConfig.date.full}

Vielse kl. ${weddingConfig.ceremony.time}
${weddingConfig.ceremony.nameNorwegian}
${formatAddress(weddingConfig.ceremony)}
Kart: ${weddingConfig.ceremony.mapsUrl}

Feiring fra kl. ${weddingConfig.venue.time}
${weddingConfig.venue.name}
${formatAddress(weddingConfig.venue)}
Kart: ${weddingConfig.venue.mapsUrl}

PRAKTISK INFO
--------------
• Vennligst møt opp ved kirken senest kl. 12:15
• Det tar ca. 30-35 minutter å kjøre fra kirken til festlokalet
• Parkering er tilgjengelig på begge steder

Mer info: ${baseUrl}/travel

Hilsen,
${weddingConfig.couple.emailSignature}`;

  return {
    subject: `${weddingConfig.email.subjectPrefix} — Vennligst bekreft ditt svar`,
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
  const actionText = purpose === 'cancel' ? 'slette' : 'endre';
  const buttonText = purpose === 'cancel' ? 'Slett mitt svar' : 'Endre mitt svar';
  
  const html = emailLayout(`
    <p style="margin: 0 0 16px; font-size: 16px; color: ${colors.text};">
      Hei ${name},
    </p>
    
    <p style="margin: 0 0 24px; font-size: 16px; color: ${colors.text}; line-height: 1.6;">
      Du ba om en sikker lenke for å ${actionText} svaret ditt. Klikk på knappen nedenfor for å fortsette.
    </p>
    
    ${ctaButton(buttonText, link)}
    
    <p style="margin: 24px 0 0; font-size: 13px; color: ${colors.textMuted}; text-align: center;">
      Denne lenken utløper om 1 time. Hvis du ikke ba om dette, kan du trygt ignorere denne e-posten.
    </p>
  `, { preheader: `Din sikre lenke for å ${actionText} svaret ditt` });
  
  const text = `Hei ${name},

Du ba om en sikker lenke for å ${actionText} svaret ditt.

${buttonText}: ${link}

Denne lenken utløper om 1 time. Hvis du ikke ba om dette, kan du trygt ignorere denne e-posten.

Hilsen,
${weddingConfig.couple.emailSignature}`;

  return {
    subject: `${weddingConfig.email.subjectPrefix} — Lenke for å ${actionText} svar`,
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
      Hei ${name},
    </p>
    
    <p style="margin: 0 0 24px; font-size: 16px; color: ${colors.text}; line-height: 1.6;">
      Svaret ditt er oppdatert. Her er din oppdaterte status:
    </p>
    
    <!-- RSVP Summary -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding: 16px; background-color: ${colors.background}; border-radius: 6px;">
      <tr>
        <td>
          <table role="presentation" cellpadding="0" cellspacing="0" style="font-size: 14px; color: ${colors.text};">
            <tr>
              <td style="padding: 4px 16px 4px 0; color: ${colors.textMuted};">Svar:</td>
              <td style="padding: 4px 0; font-weight: 500;">${rsvpSummary.attending ? '✓ Kommer' : '✗ Kan ikke komme'}</td>
            </tr>
            ${rsvpSummary.attending && rsvpSummary.guestList ? `
            <tr>
              <td style="padding: 4px 16px 4px 0; color: ${colors.textMuted};">Gjester:</td>
              <td style="padding: 4px 0;">${rsvpSummary.guestList}</td>
            </tr>` : ''}
            ${rsvpSummary.notes ? `
            <tr>
              <td style="padding: 4px 16px 4px 0; color: ${colors.textMuted}; vertical-align: top;">Melding:</td>
              <td style="padding: 4px 0;">${rsvpSummary.notes}</td>
            </tr>` : ''}
          </table>
        </td>
      </tr>
    </table>
    
    <p style="margin: 24px 0 0; font-size: 14px; color: ${colors.textMuted};">
      Trenger du å gjøre flere endringer? Du kan be om en ny endringslenke fra <a href="${baseUrl}/rsvp" style="color: ${colors.primary}; text-decoration: underline;">svarsiden</a>.
    </p>
  `, { preheader: `Svaret ditt er oppdatert.` });
  
  const text = `Hei ${name},

Svaret ditt er oppdatert.

DITT OPPDATERTE SVAR
-----------------
Svar: ${rsvpSummary.attending ? 'Kommer' : 'Kan ikke komme'}
${rsvpSummary.attending && rsvpSummary.guestList ? `Gjester: ${rsvpSummary.guestList}` : ''}
${rsvpSummary.notes ? `Melding: ${rsvpSummary.notes}` : ''}

Trenger du å gjøre flere endringer? Besøk: ${baseUrl}/rsvp

Hilsen,
${weddingConfig.couple.emailSignature}`;

  return {
    subject: `${weddingConfig.email.subjectPrefix} — Svar oppdatert`,
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
      Hei ${name},
    </p>
    
    <p style="margin: 0 0 24px; font-size: 16px; color: ${colors.text}; line-height: 1.6;">
      Svaret ditt er slettet. Det var synd at du ikke kunne komme, men takk for at du ga beskjed.
    </p>
    
    <p style="margin: 0; font-size: 14px; color: ${colors.textMuted};">
      Hvis planene endrer seg, kan du alltid sende et nytt svar på <a href="${baseUrl}/rsvp" style="color: ${colors.primary}; text-decoration: underline;">${baseUrl}/rsvp</a>
    </p>
  `, { preheader: `Svaret ditt er slettet.` });
  
  const text = `Hei ${name},

Svaret ditt er slettet. Det var synd at du ikke kunne komme, men takk for at du ga beskjed.

Hvis planene endrer seg, kan du alltid sende et nytt svar på:
${baseUrl}/rsvp

Hilsen,
${weddingConfig.couple.emailSignature}`;

  return {
    subject: `${weddingConfig.email.subjectPrefix} — Svar slettet`,
    html,
    text,
  };
}
