/**
 * Shared wedding event configuration.
 * Used by both the website and email templates.
 * 
 * To update wedding details, edit this file.
 * All changes will reflect in both the website and emails.
 */

export const weddingConfig = {
  // Couple names
  couple: {
    name1: 'Sigve',
    name2: 'Mette',
    displayName: 'Sigve & Mette',
    emailSignature: 'Mette & Sigve',
  },

  // Wedding date
  date: {
    full: 'Friday, 3rd of July 2026',
    short: '3 July 2026',
    iso: '2026-07-03',
  },

  // Ceremony details
  ceremony: {
    name: 'Botne Church',
    nameNorwegian: 'Botne kirke',
    time: '12:30',
    address: {
      street: 'Kirkeveien 19',
      postalCode: '3085',
      city: 'Holmestrand',
      country: 'Norway',
    },
    mapsUrl: 'https://maps.google.com/?q=Botne+kirke,+Kirkeveien+19,+3085+Holmestrand',
    description: 'A beautiful medieval stone church from the 13th century',
  },

  // Celebration venue details
  venue: {
    name: 'Midtåsen',
    time: '14:30',
    address: {
      street: 'Midtåsveien 2A',
      postalCode: '3226',
      city: 'Sandefjord',
      country: 'Norway',
    },
    mapsUrl: 'https://maps.google.com/?q=Midtåsen,+Midtåsveien+2A,+3226+Sandefjord',
    description: 'A historic villa estate overlooking the fjord',
  },

  // Website URLs (relative paths, combined with baseUrl in emails)
  urls: {
    travel: '/travel',
    rsvp: '/rsvp',
    gallery: '/gallery',
  },

  // Email settings
  email: {
    subjectPrefix: 'Mette & Sigve',
    // Couple photo for email header (must be publicly accessible)
    // Use a clear, elegant photo that looks good at 600px width
    couplePhoto: '/Mette og Sigve/IMG_8170.jpeg',
    couplePhotoAlt: 'Sigve and Mette',
  },
} as const;

// Helper to format full address
export function formatAddress(location: typeof weddingConfig.ceremony | typeof weddingConfig.venue): string {
  const { address } = location;
  return `${address.street}, ${address.postalCode} ${address.city}`;
}

// Helper to get ceremony summary
export function getCeremonySummary(): string {
  const { ceremony, date } = weddingConfig;
  return `${date.full} at ${ceremony.time}, ${ceremony.nameNorwegian}`;
}

export type WeddingConfig = typeof weddingConfig;
