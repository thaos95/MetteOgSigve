import Link from "next/link";

export default function Header() {
  return (
    <nav className="flex gap-4 mb-6">
      <Link href="/">Home</Link>
      <Link href="/rsvp">RSVP</Link>
      <Link href="/gallery">Gallery</Link>
      <Link href="/travel">Travel</Link>
      <Link href="/inspiration">Inspiration</Link>
      <Link href="/admin">Admin</Link>
    </nav>
  );
}