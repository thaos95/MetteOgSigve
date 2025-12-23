export default function Home() {
  return (
    <div>
      <section className="space-y-4">
        <h2 className="text-2xl font-medium">Welcome</h2>
        <p>We are so excited — please explore the site for details about the ceremony, travel, and RSVP.</p>
      </section>

      <section className="mt-8">
        <h3 className="font-semibold">Gallery preview</h3>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-gray-100 h-40 flex items-center justify-center">Placeholder Image</div>
          <div className="bg-gray-100 h-40 flex items-center justify-center">Placeholder Image</div>
        </div>
      </section>
    </div>
  );
}