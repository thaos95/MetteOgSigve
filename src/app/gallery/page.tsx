import GalleryServer from "../../components/GalleryServer";

export default async function Gallery() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="text-center mb-12">
        <h1 className="font-serif text-4xl text-primary mb-4">Galleri</h1>
        <p className="text-warm-gray max-w-xl mx-auto">
          En samling av spesielle øyeblikk. Flere bilder vil bli lagt til etter feiringen.
        </p>
      </div>

      {/* Gallery Grid */}
      <GalleryServer limit={24} />

      {/* Photo Note */}
      <div className="text-center mt-12 py-8 border-t border-soft-border">
        <p className="text-sm text-warm-gray">
          Bilder fra bryllupsdagen vil bli delt her etter feiringen.
        </p>
      </div>
    </div>
  );
}