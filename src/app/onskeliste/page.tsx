import { weddingConfig } from '../../lib/weddingConfig';
import { WishlistCard } from '../../components/WishlistCard';

export const metadata = {
  title: 'Ønskeliste – Mette & Sigve',
  description: 'Se våre ønskelister hos Tilbords, Illums Bolighus og Kitchn',
};

/**
 * Wishlist Landing Page
 * 
 * This page acts as a navigation layer to external vendor-hosted wishlists.
 * 
 * CRITICAL: All purchase tracking, quantity management, and reservations
 * are handled exclusively by the vendors. This page NEVER:
 * - Caches or duplicates wishlist state
 * - Tracks purchases or reservations
 * - Scrapes vendor content
 * - Interferes with vendor purchase flows
 * 
 * Each vendor link opens in a new tab for guests to complete purchases directly.
 */
export default function WishlistPage() {
  const { wishlists } = weddingConfig;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="text-center mb-12">
        <h1 className="font-serif text-4xl text-primary mb-4">Ønskeliste</h1>
        <p className="text-warm-gray max-w-xl mx-auto">
          Vi har satt opp ønskelister hos noen av våre favorittbutikker. 
          Klikk på en butikk for å se hva vi ønsker oss.
        </p>
      </div>

      {/* Important Information */}
      <div className="card mb-8 bg-accent/5 border-accent/20">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="font-serif text-lg text-primary mb-2">Slik fungerer det</h2>
            <ul className="text-warm-gray text-sm space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-accent mt-0.5">•</span>
                <span>Kjøp og reservasjon skjer direkte hos leverandøren</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-0.5">•</span>
                <span>Butikkene holder oversikt over hva som er kjøpt og reservert</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-0.5">•</span>
                <span>Lenkene åpner i ny fane så du kan handle når det passer deg</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Wishlist Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {wishlists.map((wishlist) => (
          <WishlistCard key={wishlist.id} wishlist={wishlist} />
        ))}
      </div>

      {/* Alternative Gift Note */}
      <div className="mt-12 text-center">
        <div className="card bg-cream/30 border-soft-border">
          <h3 className="font-serif text-lg text-primary mb-2">Gaver utenom ønskelistene?</h3>
          <p className="text-warm-gray text-sm">
            Det viktigste for oss er at dere er med og feirer dagen vår. 
            Om du heller vil gi noe annet enn det som står på ønskelistene, 
            setter vi stor pris på det også.
          </p>
        </div>
      </div>
    </div>
  );
}
