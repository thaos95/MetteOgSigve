import Image from 'next/image';

export default function Travel() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="text-center mb-12">
        <h1 className="font-serif text-4xl text-primary mb-4">Travel & Accommodation</h1>
        <p className="text-warm-gray max-w-xl mx-auto">
          Everything you need to know about getting here, the ceremony, the celebration venue, and where to stay.
        </p>
      </div>

      {/* Timeline Overview */}
      <section className="card mb-8 bg-accent/5">
        <h2 className="font-serif text-2xl text-primary mb-4 text-center">The Day at a Glance</h2>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8">
          <div className="text-center">
            <div className="text-2xl font-serif text-primary">12:30</div>
            <div className="text-warm-gray text-sm">Ceremony</div>
            <div className="text-xs text-accent">Botne Church</div>
          </div>
          <div className="hidden sm:block text-3xl text-accent">→</div>
          <div className="sm:hidden text-2xl text-accent">↓</div>
          <div className="text-center">
            <div className="text-2xl font-serif text-primary">14:30</div>
            <div className="text-warm-gray text-sm">Celebration</div>
            <div className="text-xs text-accent">Midtåsen</div>
          </div>
        </div>
      </section>

      {/* Ceremony Section */}
      <section className="card mb-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="font-serif text-2xl text-primary mb-2">Ceremony – Botne Church</h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-4">
              <div>
                <div className="mb-4">
                  <h3 className="font-medium text-primary flex items-center gap-2 mb-1">
                    <span>📍</span> Location
                  </h3>
                  <p className="text-warm-gray">
                    <strong>Botne kirke</strong><br />
                    Kirkeveien 19<br />
                    3085 Holmestrand, Norway
                  </p>
                </div>
                
                <div className="mb-4">
                  <h3 className="font-medium text-primary flex items-center gap-2 mb-1">
                    <span>🕰</span> Date & Time
                  </h3>
                  <p className="text-warm-gray">
                    <strong>Friday, 3rd of July 2026 at 12:30</strong>
                  </p>
                </div>
              </div>
              
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
                <Image 
                  src="/Botne Kirke/Botne-kirke-2.jpg" 
                  alt="Botne Church - a beautiful medieval stone church"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            
            <p className="text-warm-gray mb-4">
              Botne Church is a beautiful medieval stone church from the 13th century, located in quiet surroundings just outside Holmestrand. The ceremony will begin promptly at 12:30, so we kindly ask guests to arrive in good time.
            </p>
            
            <div className="bg-cream/50 rounded-lg p-4 border border-soft-border mb-4">
              <h3 className="font-medium text-primary mb-2">⚠️ Important Practical Information</h3>
              <ul className="text-warm-gray text-sm space-y-1">
                <li>• There is <strong>limited parking</strong> near the church</li>
                <li>• There are <strong>no public restrooms</strong> on site</li>
                <li>• The church is a short walk from nearby bus stops</li>
                <li>• We recommend <strong>carpooling</strong> where possible</li>
              </ul>
            </div>
            
            <a 
              href="https://maps.google.com/?q=Botne+kirke,+Kirkeveien+19,+3085+Holmestrand" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-secondary inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Open in Google Maps
            </a>
          </div>
        </div>
      </section>

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
            <h2 className="font-serif text-2xl text-primary mb-2">Celebration Venue – Midtåsen</h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-4">
              <div>
                <div className="mb-4">
                  <h3 className="font-medium text-primary flex items-center gap-2 mb-1">
                    <span>📍</span> Location
                  </h3>
                  <p className="text-warm-gray">
                    <strong>Midtåsen</strong><br />
                    Midtåsveien 2A<br />
                    3226 Sandefjord, Norway
                  </p>
                </div>
                
                <div className="mb-4">
                  <h3 className="font-medium text-primary flex items-center gap-2 mb-1">
                    <span>🕰</span> Arrival
                  </h3>
                  <p className="text-warm-gray">
                    <strong>From 14:30</strong>
                  </p>
                </div>
              </div>
              
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
                <Image 
                  src="/midtaasen/Luftfoto-fjorden.jpg" 
                  alt="Midtåsen - historic villa estate overlooking the fjord"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            
            <p className="text-warm-gray mb-4">
              Following the ceremony, we invite you to join us at Midtåsen for the celebration. Midtåsen is a historic villa estate overlooking Sandefjord, surrounded by beautiful gardens and a sculpture park. The venue offers stunning views of the fjord and plenty of outdoor space to enjoy throughout the day.
            </p>
            
            {/* Image Gallery */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="relative aspect-square rounded-lg overflow-hidden">
                <Image src="/midtaasen/Hagen.jpg" alt="The gardens at Midtåsen" fill className="object-cover" />
              </div>
              <div className="relative aspect-square rounded-lg overflow-hidden">
                <Image src="/midtaasen/utsikt.jpg" alt="View from Midtåsen" fill className="object-cover" />
              </div>
              <div className="relative aspect-square rounded-lg overflow-hidden">
                <Image src="/midtaasen/midtaasen-innkjorsel.jpg" alt="Midtåsen entrance" fill className="object-cover" />
              </div>
            </div>
            
            <div className="bg-cream/50 rounded-lg p-4 border border-soft-border mb-4">
              <h3 className="font-medium text-primary mb-2">Practical Information</h3>
              <ul className="text-warm-gray text-sm space-y-1">
                <li>• Free parking available just before the main gate</li>
                <li>• The grounds are partially outdoors – we recommend comfortable footwear</li>
                <li>• The sculpture park is open and free to explore</li>
              </ul>
            </div>
            
            <a 
              href="https://maps.google.com/?q=Midtåsen,+Midtåsveien+2A,+3226+Sandefjord" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-secondary inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Open in Google Maps
            </a>
          </div>
        </div>
      </section>

      {/* Getting Between Locations */}
      <section className="card mb-8 bg-accent/5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="font-serif text-2xl text-primary mb-2">Getting from the Church to the Venue</h2>
            <div className="flex flex-wrap gap-6 text-warm-gray mb-4">
              <div>
                <span className="text-2xl">🚗</span>
                <p><strong>Driving time:</strong> approx. 30–35 minutes</p>
              </div>
              <div>
                <span className="text-2xl">📏</span>
                <p><strong>Distance:</strong> approx. 30 km</p>
              </div>
            </div>
            <p className="text-warm-gray">
              We recommend leaving the church area shortly after the ceremony to arrive comfortably at Midtåsen from 14:30.
            </p>
            <p className="text-sm text-accent mt-2 italic">
              Additional transport information will be shared closer to the date if group transport is arranged.
            </p>
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
            <h2 className="font-serif text-2xl text-primary mb-4">Getting There</h2>
            <div className="space-y-6 text-warm-gray">
              <div>
                <h3 className="font-medium text-primary mb-2 flex items-center gap-2">
                  <span>✈️</span> By Air
                </h3>
                <ul className="text-sm space-y-2">
                  <li><strong>Sandefjord Airport Torp (TRF)</strong> – approx. 15 minutes by car to Midtåsen</li>
                  <li><strong>Oslo Airport Gardermoen (OSL)</strong> – approx. 1.5–2 hours by car or train</li>
                </ul>
                <p className="text-sm mt-2">From both airports, you can travel by rental car, train + taxi, or taxi directly.</p>
              </div>
              
              <div>
                <h3 className="font-medium text-primary mb-2 flex items-center gap-2">
                  <span>🚆</span> By Train
                </h3>
                <ul className="text-sm space-y-2">
                  <li><strong>Sandefjord Station</strong> – close to Midtåsen</li>
                  <li><strong>Holmestrand Station</strong> – closest station to Botne Church</li>
                </ul>
                <p className="text-sm mt-2">Norwegian trains are frequent and reliable. From the stations, taxis are readily available.</p>
              </div>
              
              <div>
                <h3 className="font-medium text-primary mb-2 flex items-center gap-2">
                  <span>🚗</span> By Car
                </h3>
                <p className="text-sm">
                  Sandefjord and Holmestrand are easily accessible by car from Oslo and other parts of Norway. We recommend using Google Maps for up-to-date directions and traffic conditions.
                </p>
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
              There are many great places to stay in <strong>Sandefjord</strong>, which is the most convenient location after the celebration.
            </p>
            
            <div className="grid gap-4 sm:grid-cols-2 mb-4">
              <div className="p-4 bg-cream/50 rounded-lg border border-soft-border">
                <h3 className="font-medium text-primary mb-2">Recommended Hotels in Sandefjord</h3>
                <ul className="text-sm text-warm-gray space-y-1">
                  <li>• Clarion Collection Hotel Atlantic</li>
                  <li>• Scandic Park Sandefjord</li>
                  <li>• Hotel Kong Carl</li>
                </ul>
              </div>
              <div className="p-4 bg-cream/50 rounded-lg border border-soft-border">
                <h3 className="font-medium text-primary mb-2">Alternative Nearby Options</h3>
                <ul className="text-sm text-warm-gray space-y-1">
                  <li>• Holmestrand & Åsgårdstrand (limited)</li>
                  <li>• Tønsberg (short drive)</li>
                </ul>
              </div>
            </div>
            
            <p className="text-sm text-accent italic">
              We recommend booking accommodation early, as July is a popular summer period.
            </p>
          </div>
        </div>
      </section>

      {/* Contact for Help */}
      <section className="text-center py-8 border-t border-soft-border">
        <h2 className="font-serif text-xl text-primary mb-2">Questions?</h2>
        <p className="text-warm-gray mb-4">
          If you have any questions regarding travel, accommodation, or logistics, feel free to reach out to us.
        </p>
        <p className="text-lg mb-4">We can't wait to celebrate with you ❤️</p>
        <a href="mailto:contact@example.com" className="btn-secondary inline-flex">
          Get in touch
        </a>
      </section>
    </div>
  );
}