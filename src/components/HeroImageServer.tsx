import fs from 'fs';
import path from 'path';

export default async function HeroImageServer() {
  const dir = path.join(process.cwd(), 'public', 'Mette og Sigve');
  let files: string[] = [];
  try {
    files = await fs.promises.readdir(dir);
  } catch (e) {
    files = [];
  }
  const imageFiles = files.filter(f => /\.(jpe?g|png|gif)$/i.test(f));
  const first = imageFiles[0];
  if (!first) return null;

  return (
    <div className="mt-6 rounded overflow-hidden shadow">
      <img src={`/${encodeURIComponent('Mette og Sigve')}/${encodeURIComponent(first)}`} alt="Hero" className="w-full h-60 object-cover" />
    </div>
  );
}
