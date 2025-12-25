import RSVPForm from "../../components/RSVPForm";

export default function RSVPPage() {
  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="font-serif text-3xl sm:text-4xl text-primary mb-4">Svar på invitasjon</h2>
        <p className="text-warm-gray text-lg">
          Vennligst gi oss beskjed om du kan komme og feire dagen med oss.
        </p>
      </div>
      <div className="card">
        <RSVPForm />
      </div>
    </div>
  );
}