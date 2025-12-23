import RSVPForm from "../../components/RSVPForm";

export default function RSVPPage() {
  return (
    <div>
      <h2 className="text-2xl font-medium">RSVP</h2>
      <p className="mt-2 text-sm text-gray-600">Please let us know if you can join us.</p>
      <div className="mt-6">
        <RSVPForm />
      </div>
    </div>
  );
}