'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const links = [
  { href: '/', label: 'Hjem' },
  { href: '/rsvp', label: 'Invitasjon' },
  { href: '/onskeliste', label: 'Ønskeliste' },
  { href: '/gallery', label: 'Galleri' },
  { href: '/travel', label: 'Reise & Info' },
];

/**
 * Mobile navigation with hamburger menu
 * 
 * - Shows hamburger icon on mobile (< 640px)
 * - Opens a dropdown menu with all nav links
 * - Closes on: link click, escape key, outside click
 * - Accessible: aria-expanded, aria-label, focus management
 */
export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative sm:hidden">
      {/* Hamburger button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 -mr-2 text-warm-gray hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 rounded-md"
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Lukk meny' : 'Åpne meny'}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-soft-border py-2 z-50"
        >
          <nav aria-label="Mobilmeny">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2.5 text-sm font-medium text-warm-gray hover:text-primary hover:bg-primary/5 transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
