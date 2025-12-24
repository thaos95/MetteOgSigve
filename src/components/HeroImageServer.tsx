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
  
  // Fallback gradient if no image
  if (!first) {
    return (
      <div className="w-full h-[60vh] sm:h-[70vh] bg-gradient-to-br from-primary/20 to-accent/20" />
    );
  }

  return (
    <div className="relative w-full h-[60vh] sm:h-[70vh] overflow-hidden">
      <img 
        src={`/${encodeURIComponent('Mette og Sigve')}/${encodeURIComponent(first)}`} 
        alt="Mette and Sigve" 
        className="w-full h-full object-cover"
        loading="eager"
      />
    </div>
  );
}
