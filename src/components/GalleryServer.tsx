import fs from 'fs';
import path from 'path';
import GalleryClient from './GalleryClient';

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

  return <GalleryClient images={imageFiles} />;
}
