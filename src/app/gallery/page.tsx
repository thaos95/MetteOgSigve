export default function Gallery() {
  return (
    <div>
      <h2 className="text-2xl font-medium">Gallery</h2>
      <p className="mt-2 text-sm text-gray-600">Placeholder gallery — replace with your images.</p>
      <div className="grid grid-cols-3 gap-4 mt-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-gray-100 h-40 flex items-center justify-center">Image {i + 1}</div>
        ))}
      </div>
    </div>
  );
}