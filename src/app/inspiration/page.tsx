import fs from 'fs';
import path from 'path';

export default async function Inspiration() {
  const dir = path.join(process.cwd(), 'public', 'pdfs');
  let files: string[] = [];
  try {
    files = await fs.promises.readdir(dir);
  } catch (e) {
    files = [];
  }

  const pdfs = files.filter(f => /\.pdf$/i.test(f));

  return (
    <div>
      <h2 className="text-2xl font-medium">Inspiration</h2>
      <p className="mt-2 text-sm text-gray-600">This page displays PDF inspirations (uploaded to <code>/public/pdfs</code>).</p>

      {pdfs.length === 0 ? (
        <div className="mt-4 text-gray-500">No PDFs found — place your print-to-PDF files in <code>/public/pdfs</code> to see them here.</div>
      ) : (
        <div className="mt-4 space-y-6">
          {pdfs.map(p => (
            <div key={p} className="border rounded overflow-hidden">
              <div className="p-3 bg-gray-100"><strong>{p}</strong></div>
              <div className="h-96">
                <iframe src={`/pdfs/${encodeURIComponent(p)}`} className="w-full h-full" title={p}></iframe>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}