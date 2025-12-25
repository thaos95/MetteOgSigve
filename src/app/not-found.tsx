import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h2 className="font-serif text-4xl text-primary mb-4">404</h2>
      <p className="text-xl text-warm-gray mb-8">Vi fant dessverre ikke siden du lette etter.</p>
      <Link href="/" className="btn-primary">
        Gå til forsiden
      </Link>
    </div>
  );
}
