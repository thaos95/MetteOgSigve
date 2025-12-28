import Link from 'next/link';

export interface WishlistVendor {
  id: string;
  name: string;
  description: string;
  url: string;
  logo?: string;
}

interface WishlistCardProps {
  wishlist: WishlistVendor;
}

/**
 * Wishlist Card Component
 * 
 * Displays a single vendor wishlist with a link that opens in a new tab.
 * This component ONLY provides navigation - all wishlist state management
 * is handled by the vendor.
 * 
 * Security:
 * - Uses rel="noopener noreferrer" to prevent tabnabbing
 * - Opens in new tab to preserve vendor's full functionality
 * - No iframe or embedded content
 */
export function WishlistCard({ wishlist }: WishlistCardProps) {
  return (
    <Link
      href={wishlist.url}
      target="_blank"
      rel="noopener noreferrer"
      className="card group hover:shadow-lg transition-all duration-200 hover:border-accent/30 flex flex-col h-full"
    >
      {/* Vendor Icon/Logo Placeholder */}
      <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
        <svg 
          className="w-6 h-6 text-primary" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" 
          />
        </svg>
      </div>
      
      {/* Vendor Info */}
      <div className="flex-1">
        <h3 className="font-serif text-xl text-primary mb-1 group-hover:text-accent transition-colors">
          {wishlist.name}
        </h3>
        <p className="text-warm-gray text-sm mb-4">
          {wishlist.description}
        </p>
      </div>
      
      {/* CTA */}
      <div className="flex items-center gap-2 text-accent text-sm font-medium mt-auto pt-4 border-t border-soft-border/50">
        <span>Se ønskeliste</span>
        <svg 
          className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </div>
    </Link>
  );
}

export default WishlistCard;
