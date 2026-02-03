import Link from "next/link";

const links = [
  { href: "/", label: "Hjem" },
  { href: "/rsvp", label: "Invitasjon" },
  { href: "/onskeliste", label: "Ønskeliste" },
  { href: "/gallery", label: "Galleri" },
  { href: "/travel", label: "Reise & Info" },
];

/**
 * Desktop navigation (hidden on mobile, visible sm+)
 * Mobile uses MobileNav component with hamburger menu
 */
export default function Header() {
  return (
    <nav className="hidden sm:flex gap-2" aria-label="Hovedmeny">
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className="px-3 py-1.5 text-sm font-medium text-warm-gray rounded-md transition-colors duration-200 hover:text-primary hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 whitespace-nowrap"
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}