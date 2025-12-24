import GalleryServer from "../components/GalleryServer";
import HeroImageServer from "../components/HeroImageServer";
import Link from "next/link";

export default async function Home() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative -mx-6 -mt-10">
        <HeroImageServer />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-6">
          <p className="text-sm uppercase tracking-[0.3em] mb-3 opacity-90">You are invited to celebrate</p>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-medium mb-4">Mette & Sigve</h2>
          <p className="text-lg opacity-90 mb-8">are getting married</p>
          <Link 
            href="/rsvp" 
            className="btn-primary text-base px-8 py-3 bg-white/20 backdrop-blur-sm border border-white/40 hover:bg-white/30"
          >
            RSVP Now
          </Link>
        </div>
      </section>

      {/* Welcome Section */}
      <section className="text-center max-w-2xl mx-auto">
        <h2 className="font-serif text-3xl sm:text-4xl text-primary mb-6">Welcome</h2>
        <p className="text-warm-gray leading-relaxed text-lg">
          We are so excited to share this special day with you. Please explore the site for details about the ceremony, travel information, and to let us know if you can join us.
        </p>
      </section>

      {/* Quick Links */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Link href="/rsvp" className="card text-center group hover:shadow-md transition-shadow">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-serif text-xl text-primary mb-2 group-hover:text-primary-dark transition-colors">RSVP</h3>
          <p className="text-sm text-warm-gray">Let us know if you can join</p>
        </Link>
        <Link href="/travel" className="card text-center group hover:shadow-md transition-shadow">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="font-serif text-xl text-primary mb-2 group-hover:text-primary-dark transition-colors">Travel</h3>
          <p className="text-sm text-warm-gray">How to get there & stay</p>
        </Link>
        <Link href="/gallery" className="card text-center group hover:shadow-md transition-shadow">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="font-serif text-xl text-primary mb-2 group-hover:text-primary-dark transition-colors">Gallery</h3>
          <p className="text-sm text-warm-gray">View our photos</p>
        </Link>
      </section>

      {/* Gallery Preview */}
      <section>
        <div className="text-center mb-8">
          <h2 className="font-serif text-3xl text-primary mb-3">Gallery</h2>
          <p className="text-warm-gray">A glimpse of our journey together</p>
        </div>
        <GalleryServer limit={4} />
        <div className="mt-6 text-center">
          <Link href="/gallery" className="btn-secondary">
            View all photos
          </Link>
        </div>
      </section>
    </div>
  );
}