import Link from "next/link";

export default function Header() {
  const links = [
    { href: "/", label: "Home" },
    { href: "/rsvp", label: "RSVP" },
    { href: "/gallery", label: "Gallery" },
    { href: "/travel", label: "Travel" },
  ];

  return (
    <nav className="flex flex-wrap gap-1 sm:gap-2" aria-label="Main navigation">
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className="px-3 py-1.5 text-sm font-medium text-warm-gray rounded-md transition-colors duration-200 hover:text-primary hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}