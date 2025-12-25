import fs from 'fs';
import path from 'path';
import Image from 'next/image';

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

  if (imageFiles.length === 0) {
    return (
      <div className="text-center py-12 text-warm-gray">
        <p>No images found. Add photos to /public/Mette og Sigve to display the gallery.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
      {imageFiles.map((file, index) => (
        <div 
          key={file} 
          className="group relative aspect-square overflow-hidden rounded-lg bg-soft-border shadow-sm hover:shadow-md transition-shadow duration-300"
        >
          <Image 
            src={`/Mette og Sigve/${file}`} 
            alt={`Gallery photo ${index + 1}`} 
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            loading={index < 4 ? "eager" : "lazy"}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIhAAAgIBAwQDAAAAAAAAAAAAAQIDBAAFESEGEhMxQVFh/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAZEQACAwEAAAAAAAAAAAAAAAABAgADESH/2gAMAwEAAhEDEEA/AMK6d1O/o1qxNVaMrYjEcgkjVwVBB2+fRwclp/V2t1IIoIbSrHEixoohQ4UADA3x7wYMaTjYjdT5Of/Z"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 pointer-events-none" />
        </div>
      ))}
    </div>
  );
}
