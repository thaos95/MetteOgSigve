import fs from 'fs';
import path from 'path';

type Props = { limit?: number };

export default async function GalleryServer({ limit = 12 }: Props) {
  const dir = path.join(process.cwd(), 'public', 'Mette og Sigve');
  let files: string[] = [];
  try {
    files = await fs.promises.readdir(dir);
  } catch (e) {
    // directory not present
    files = [];
  }

  const imageFiles = files.filter(f => /\.(jpe?g|png|gif)$/i.test(f)).slice(0, limit);

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mt-4">
      {imageFiles.length === 0 ? (
        <div className="col-span-3 text-gray-500">No images found in /public/Mette og Sigve. Place images there to show the gallery.</div>
      ) : (
        imageFiles.map((file) => (
          <div key={file} className="bg-gray-100 h-40 overflow-hidden rounded shadow-sm">
            <img src={`/${encodeURIComponent('Mette og Sigve')}/${encodeURIComponent(file)}`} alt={file} className="w-full h-full object-cover" />
          </div>
        ))
      )}
    </div>
  );
}
