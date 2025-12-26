import Image from 'next/image';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export default function Travel() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="text-center mb-12">
        <h1 className="font-serif text-4xl text-primary mb-4">Reise og overnatting</h1>
        <p className="text-warm-gray max-w-xl mx-auto">
          Her finner du informasjon om vielsen, festen, reise og overnatting.
        </p>
      </div>

      {/* Timeline Overview */}
      <section className="card mb-8 bg-accent/5">
        <h2 className="font-serif text-2xl text-primary mb-4 text-center">Dagen kort oppsummert</h2>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8">
          <div className="text-center">
            <div className="text-2xl font-serif text-primary">12:30</div>
            <div className="text-warm-gray text-sm">Vielse</div>
            <div className="text-xs text-accent">Botne kirke</div>
          </div>
          <div className="hidden sm:block text-3xl text-accent">→</div>
          <div className="sm:hidden text-2xl text-accent">↓</div>
          <div className="text-center">
            <div className="text-2xl font-serif text-primary">14:30</div>
            <div className="text-warm-gray text-sm">Feiring</div>
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
            <h2 className="font-serif text-2xl text-primary mb-2">Vielse – Botne kirke</h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-4">
              <div>
                <div className="mb-4">
                  <h3 className="font-medium text-primary flex items-center gap-2 mb-1">
                    <span>📍</span> Sted
                  </h3>
                  <p className="text-warm-gray">
                    <strong>Botne kirke</strong><br />
                    Kirkeveien 19<br />
                    3085 Holmestrand, Norge
                  </p>
                </div>
                
                <div className="mb-4">
                  <h3 className="font-medium text-primary flex items-center gap-2 mb-1">
                    <span>🕰</span> Tidspunkt
                  </h3>
                  <p className="text-warm-gray">
                    <strong>Fredag 3. juli 2026 kl. 12:30</strong>
                  </p>
                </div>
              </div>
              
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
                <Image 
                  src="/Botne Kirke/Botne-kirke-2.jpg" 
                  alt="Botne kirke - en vakker middelalderkirke"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            
            <p className="text-warm-gray mb-4">
              Botne kirke er en vakker middelalderkirke fra 1200-tallet, som ligger i rolige omgivelser like utenfor Holmestrand. Vielsen starter presis kl. 12:30, så vi ber gjester om å være ute i god tid – senest 12:15.
            </p>
            
            <div className="bg-cream/50 rounded-lg p-4 border border-soft-border mb-4">
              <h3 className="font-medium text-primary mb-2">Praktisk informasjon</h3>
              <ul className="text-warm-gray text-sm space-y-1">
                <li>• <strong>Parkering</strong> er tilgjengelig ved kirken</li>
                <li>• <strong>Toaletter</strong> finnes på stedet</li>
              </ul>
            </div>
            
            {/* Google Maps Embed */}
            <div className="aspect-video rounded-lg overflow-hidden border border-soft-border mb-4">
              <iframe
                src={`https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=Botne+kirke,+Kirkeveien+19,+3085+Holmestrand,Norway&zoom=14`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Botne kirke kart"
              />
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
              Åpne i Google Maps
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
            <h2 className="font-serif text-2xl text-primary mb-2">Feiring – Midtåsen</h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-4">
              <div>
                <div className="mb-4">
                  <h3 className="font-medium text-primary flex items-center gap-2 mb-1">
                    <span>📍</span> Sted
                  </h3>
                  <p className="text-warm-gray">
                    <strong>Midtåsen</strong><br />
                    Midtåsveien 2A<br />
                    3226 Sandefjord, Norge
                  </p>
                </div>
                
                <div className="mb-4">
                  <h3 className="font-medium text-primary flex items-center gap-2 mb-1">
                    <span>🕰</span> Ankomst
                  </h3>
                  <p className="text-warm-gray">
                    <strong>Fra kl. 14:30</strong>
                  </p>
                </div>
              </div>
              
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
                <Image 
                  src="/midtaasen/Luftfoto-fjorden.jpg" 
                  alt="Midtåsen - historisk villa med utsikt"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            
            <p className="text-warm-gray mb-4">
              Etter vielsen inviterer vi til feiring på Midtåsen. Midtåsen er en historisk villa som ligger høyt over Sandefjord, omgitt av vakre hager og en skulpturpark. Stedet byr på fantastisk utsikt over fjorden og god plass til å nyte dagen utendørs.
            </p>
            
            {/* Image Gallery */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="relative aspect-square rounded-lg overflow-hidden">
                <Image src="/midtaasen/Hagen.jpg" alt="Hagen på Midtåsen" fill className="object-cover" />
              </div>
              <div className="relative aspect-square rounded-lg overflow-hidden">
                <Image src="/midtaasen/utsikt.jpg" alt="Utsikt fra Midtåsen" fill className="object-cover" />
              </div>
              <div className="relative aspect-square rounded-lg overflow-hidden">
                <Image src="/midtaasen/midtaasen-innkjorsel.jpg" alt="Innkjøring til Midtåsen" fill className="object-cover" />
              </div>
            </div>
            
            <div className="bg-cream/50 rounded-lg p-4 border border-soft-border mb-4">
              <h3 className="font-medium text-primary mb-2">Praktisk informasjon</h3>
              <ul className="text-warm-gray text-sm space-y-1">
                <li>• Gratis parkering tilgjengelig like før hovedporten</li>
                <li>• <b>Stillethæler er ikke tillatt</b> – hælbredde skal være større enn en 1-krone</li>
                <li>• Fingermat og aperitiff serveres ved ankomst</li>
              </ul>
            </div>
            
            {/* Google Maps Embed */}
            <div className="aspect-video rounded-lg overflow-hidden border border-soft-border mb-4">
              <iframe
                src={`https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=Midtåsen,+Midtåsveien+2A,+3226+Sandefjord,Norway&zoom=14`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Midtåsen kart"
              />
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
              Åpne i Google Maps
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
            <h2 className="font-serif text-2xl text-primary mb-2">Fra kirken til festlokalet</h2>
            <div className="flex flex-wrap gap-6 text-warm-gray mb-4">
              <div>
                <span className="text-2xl">🚗</span>
                <p><strong>Kjøretid:</strong> ca. 30–35 minutter</p>
              </div>
              <div>
                <span className="text-2xl">📏</span>
                <p><strong>Avstand:</strong> ca. 30 km</p>
              </div>
            </div>
            <p className="text-warm-gray">
              Vi anbefaler å kjøre fra kirken kort tid etter vielsen for å ankomme Midtåsen fra kl. 14:30.
            </p>
            <p className="text-sm text-accent mt-2 italic">
              Hvis du trenger hjelp med transport eller samkjøring, ta gjerne kontakt med oss.
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
            <h2 className="font-serif text-2xl text-primary mb-4">Reiseinformasjon</h2>
            <div className="space-y-6 text-warm-gray">
              <div>
                <h3 className="font-medium text-primary mb-2 flex items-center gap-2">
                  <span>✈️</span> Med fly
                </h3>
                <ul className="text-sm space-y-2">
                  <li><strong>Sandefjord Lufthavn Torp (TRF)</strong> – ca. 15 minutter med bil til Midtåsen</li>
                  <li><strong>Oslo Lufthavn Gardermoen (OSL)</strong> – ca. 1,5–2 timer med bil eller tog</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-primary mb-2 flex items-center gap-2">
                  <span>🚆</span> Med tog
                </h3>
                <ul className="text-sm space-y-2">
                  <li><strong>Sandefjord stasjon</strong> – nært Midtåsen</li>
                  <li><strong>Holmestrand stasjon</strong> – nærmest Botne kirke</li>
                </ul>
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
            <h2 className="font-serif text-2xl text-primary mb-2">Overnatting</h2>
            <p className="text-warm-gray mb-4">
              Det er mange fine steder å bo i <strong>Sandefjord</strong>, som er mest praktisk etter festen.
            </p>
            
            <div className="grid gap-4 sm:grid-cols-2 mb-4">
              <div className="p-4 bg-cream/50 rounded-lg border border-soft-border">
                <h3 className="font-medium text-primary mb-2">Anbefalte hoteller i Sandefjord</h3>
                <ul className="text-sm text-warm-gray space-y-1">
                  <li>• Clarion Collection Hotel Atlantic</li>
                  <li>• Scandic Park Sandefjord</li>
                  <li>• Hotel Kong Carl</li>
                </ul>
              </div>
              <div className="p-4 bg-cream/50 rounded-lg border border-soft-border">
                <h3 className="font-medium text-primary mb-2">Andre alternativer i nærheten</h3>
                <ul className="text-sm text-warm-gray space-y-1">
                  <li>• Holmestrand</li>
                  <li>• Horten/Tønsberg (kort kjøretur)</li>
                  <li>• Airbnb og ferieutleie</li>
                </ul>
              </div>
            </div>
            
            <p className="text-sm text-accent italic">
              Vi anbefaler å bestille overnatting tidlig, da juli er en populær sommermåned.
            </p>
          </div>
        </div>
      </section>

      {/* Contact for Help */}
      <section className="text-center py-8 border-t border-soft-border">
        <h2 className="font-serif text-xl text-primary mb-2">Spørsmål?</h2>
        <p className="text-warm-gray mb-4">
          Hvis du har spørsmål om reise, overnatting eller logistikk, ta gjerne kontakt med oss.
        </p>
        <p className="text-lg mb-4">Vi gleder oss til å feire med dere ❤️</p>
        <a href="mailto:trygvesolberg95314@gmail.com" className="btn-secondary inline-flex">
          Ta kontakt
        </a>
      </section>
    </div>
  );
}