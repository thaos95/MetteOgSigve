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
    full: 'Fredag 3. juli 2026',
    short: '3. juli 2026',
    iso: '2026-07-03',
  },

  // Ceremony details
  ceremony: {
    name: 'Botne kirke',
    nameNorwegian: 'Botne kirke',
    time: '12:30',
    address: {
      street: 'Kirkeveien 19',
      postalCode: '3085',
      city: 'Holmestrand',
      country: 'Norge',
    },
    mapsUrl: 'https://maps.google.com/?q=Botne+kirke,+Kirkeveien+19,+3085+Holmestrand',
    description: 'En vakker middelalderkirke fra 1200-tallet',
  },

  // Celebration venue details
  venue: {
    name: 'Midtåsen',
    time: '14:30',
    address: {
      street: 'Midtåsveien 2A',
      postalCode: '3226',
      city: 'Sandefjord',
      country: 'Norge',
    },
    mapsUrl: 'https://maps.google.com/?q=Midtåsen,+Midtåsveien+2A,+3226+Sandefjord',
    description: 'En historisk villa med utsikt over fjorden',
  },

  // Website URLs (relative paths, combined with baseUrl in emails)
  urls: {
    travel: '/travel',
    rsvp: '/rsvp',
    gallery: '/gallery',
    wishlist: '/onskeliste',
  },

  // External wishlist URLs
  // These are vendor-hosted wishlists with their own quantity/purchase tracking
  // DO NOT cache or duplicate wishlist state - always link directly to vendor
  wishlists: [
    {
      id: 'tilbords',
      name: 'Tilbords',
      description: 'Servise og kjøkkenutstyr',
      url: 'https://www.tilbords.no/min-side/onskelister/172091/',
      logo: '/vendors/tilbords-logo.png', // Optional - can be null if not available
    },
    {
      id: 'illumsbolighus',
      name: 'Illums Bolighus',
      description: 'Interiør og design',
      url: 'https://www.illumsbolighus.no/onskeliste/andre?id=761fabb33f00e34b46fe2624ab',
      logo: '/vendors/illums-logo.png',
    },
    {
      id: 'kitchn',
      name: 'Kitchn',
      description: 'Kjøkkenutstyr',
      url: 'https://www.kitchn.no/onskeliste/245134/',
      logo: '/vendors/kitchn-logo.png',
    },
  ],

  // Email settings
  email: {
    subjectPrefix: 'Mette & Sigve',
    // Couple photo for email header (must be publicly accessible)
    // Use a clear, elegant photo that looks good at 600px width
    couplePhoto: '/Mette og Sigve/IMG_8170.jpeg',
    couplePhotoAlt: 'Sigve og Mette',
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
  return `${date.full} kl. ${ceremony.time}, ${ceremony.nameNorwegian}`;
}

export type WeddingConfig = typeof weddingConfig;
