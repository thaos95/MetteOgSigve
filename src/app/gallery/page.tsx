import GalleryServer from "../../components/GalleryServer";

export default async function Gallery() {
  return (
    <div>
      <h2 className="text-2xl font-medium">Gallery</h2>
      <p className="mt-2 text-sm text-gray-600">A selection of images from the project — replace or add more in `/public/Mette og Sigve`.</p>
      <div className="mt-4">
        {/* Server component that reads images from public folder */}
        <GalleryServer limit={12} />
      </div>
    </div>
  );
}