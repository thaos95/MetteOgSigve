'use client';

import { useEffect, useState } from 'react';

/**
 * Header branding with scroll-aware behavior
 * 
 * - "Mette & Sigve" is always visible
 * - "Vi gifter oss" fades out on scroll for a cleaner, thinner nav
 * - Uses CSS transitions for smooth, subtle animation
 * - No layout shifts - uses opacity and height transition
 */
export default function HeaderBranding() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Trigger after scrolling 50px
      setIsScrolled(window.scrollY > 50);
    };

    // Check initial scroll position
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-w-0">
      <h1 className="font-serif text-2xl sm:text-3xl font-medium text-primary tracking-wide">
        Mette & Sigve
      </h1>
      <p 
        className={`text-sm text-warm-gray transition-all duration-300 ease-in-out overflow-hidden ${
          isScrolled 
            ? 'opacity-0 max-h-0 mt-0' 
            : 'opacity-100 max-h-6 mt-0.5'
        }`}
      >
        Vi gifter oss
      </p>
    </div>
  );
}
