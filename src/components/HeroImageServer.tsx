import fs from 'fs';
import path from 'path';
import Image from 'next/image';

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
      <Image 
        src={`/Mette og Sigve/${first}`} 
        alt="Mette og Sigve" 
        fill
        sizes="100vw"
        className="object-cover"
        priority
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIhAAAgIBAwQDAAAAAAAAAAAAAQIDBAAFESEGEhMxQVFh/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAZEQACAwEAAAAAAAAAAAAAAAABAgADESH/2gAMAwEAAhEDEEA/AMK6d1O/o1qxNVaMrYjEcgkjVwVBB2+fRwclp/V2t1IIoIbSrHEixoohQ4UADA3x7wYMaTjYjdT5Of/Z"
      />
    </div>
  );
}
