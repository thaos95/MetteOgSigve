import GalleryServer from "../components/GalleryServer";
import HeroImageServer from "../components/HeroImageServer";

export default async function Home() {
  return (
    <div>
      <section className="space-y-4">
        <h2 className="text-2xl font-medium">Welcome</h2>
        <p>We are so excited — please explore the site for details about the ceremony, travel, and RSVP.</p>
        <HeroImageServer />
      </section>

      <section className="mt-8">
        <h3 className="font-semibold">Gallery preview</h3>
        <p className="text-sm text-gray-600">Inspired by the PDFs — layout uses full-bleed previews and a simple grid for photos.</p>
        <div className="mt-4">
          <GalleryServer limit={4} />
          <div className="mt-4 text-sm text-gray-500">Full gallery: <a href="/gallery" className="underline">View all photos</a></div>
        </div>
      </section>
    </div>
  );
}