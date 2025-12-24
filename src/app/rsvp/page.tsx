import RSVPForm from "../../components/RSVPForm";

export default function RSVPPage() {
  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="font-serif text-3xl sm:text-4xl text-primary mb-4">RSVP</h2>
        <p className="text-warm-gray text-lg">
          Please let us know if you can join us on our special day.
        </p>
      </div>
      <div className="card">
        <RSVPForm />
      </div>
    </div>
  );
}