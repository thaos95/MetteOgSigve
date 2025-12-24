export default function Travel() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="text-center mb-12">
        <h1 className="font-serif text-4xl text-primary mb-4">Travel & Accommodation</h1>
        <p className="text-warm-gray max-w-xl mx-auto">
          Everything you need to know about getting here and where to stay.
        </p>
      </div>

      {/* Venue Section */}
      <section className="card mb-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="font-serif text-2xl text-primary mb-2">The Venue</h2>
            <p className="text-warm-gray mb-4">
              Our celebration will be held at a beautiful location. Details coming soon.
            </p>
            <div className="aspect-video bg-cream rounded-lg flex items-center justify-center text-warm-gray border border-soft-border">
              <span className="text-sm">Map placeholder</span>
            </div>
          </div>
        </div>
      </section>

      {/* Getting There */}
      <section className="card mb-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="font-serif text-2xl text-primary mb-2">Getting There</h2>
            <div className="space-y-4 text-warm-gray">
              <div>
                <h3 className="font-medium text-primary mb-1">By Air</h3>
                <p className="text-sm">The nearest airport information will be provided here.</p>
              </div>
              <div>
                <h3 className="font-medium text-primary mb-1">By Car</h3>
                <p className="text-sm">Driving directions and parking information.</p>
              </div>
              <div>
                <h3 className="font-medium text-primary mb-1">By Train</h3>
                <p className="text-sm">Public transport options from major cities.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Accommodation */}
      <section className="card mb-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="font-serif text-2xl text-primary mb-2">Where to Stay</h2>
            <p className="text-warm-gray mb-4">
              We've compiled some accommodation options nearby for your convenience.
            </p>
            
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Hotel Card */}
              <div className="p-4 bg-cream/50 rounded-lg border border-soft-border">
                <h3 className="font-medium text-primary mb-1">Nearby Hotels</h3>
                <p className="text-sm text-warm-gray mb-2">Several options within 10 minutes of the venue.</p>
                <span className="text-xs text-accent">Recommendations coming soon</span>
              </div>
              {/* Airbnb Card */}
              <div className="p-4 bg-cream/50 rounded-lg border border-soft-border">
                <h3 className="font-medium text-primary mb-1">Vacation Rentals</h3>
                <p className="text-sm text-warm-gray mb-2">Great for groups or families.</p>
                <span className="text-xs text-accent">Recommendations coming soon</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact for Help */}
      <section className="text-center py-8 border-t border-soft-border">
        <p className="text-warm-gray mb-4">
          Need help with travel arrangements?
        </p>
        <a href="mailto:contact@example.com" className="btn-secondary inline-flex">
          Get in touch
        </a>
      </section>
    </div>
  );
}