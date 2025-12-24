import GalleryServer from "../../components/GalleryServer";

export default async function Gallery() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="text-center mb-12">
        <h1 className="font-serif text-4xl text-primary mb-4">Our Gallery</h1>
        <p className="text-warm-gray max-w-xl mx-auto">
          A collection of special moments. More photos will be added after the celebration.
        </p>
      </div>

      {/* Gallery Grid */}
      <GalleryServer limit={24} />

      {/* Photo Note */}
      <div className="text-center mt-12 py-8 border-t border-soft-border">
        <p className="text-sm text-warm-gray">
          Photos from the wedding day will be shared here after the celebration.
        </p>
      </div>
    </div>
  );
}