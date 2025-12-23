"use client";
import { useState } from "react";

export default function RSVPForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [attending, setAttending] = useState(true);
  const [guests, setGuests] = useState(0);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const res = await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, attending, guests, notes })
    });
    if (res.ok) setStatus("done"); else setStatus("error");
  }

  return (
    <form onSubmit={submit} className="space-y-4 max-w-lg">
      <div>
        <label className="block text-sm">Name</label>
        <input value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full p-2 border rounded" required />
      </div>

      <div>
        <label className="block text-sm">Email</label>
        <input value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full p-2 border rounded" type="email" />
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          <input type="radio" checked={attending} onChange={() => setAttending(true)} /> Attending
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" checked={!attending} onChange={() => setAttending(false)} /> Not attending
        </label>
      </div>

      <div>
        <label className="block text-sm">Number of guests</label>
        <input value={guests} onChange={e => setGuests(Number(e.target.value))} className="mt-1 w-24 p-2 border rounded" type="number" min={0} />
      </div>

      <div>
        <label className="block text-sm">Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} className="mt-1 w-full p-2 border rounded" rows={4} />
      </div>

      <div>
        <button type="submit" className="px-4 py-2 bg-black text-white rounded" disabled={status === "sending"}>Send RSVP</button>
        {status === "done" && <p className="mt-2 text-sm text-green-600">Thanks — your RSVP has been submitted.</p>}
        {status === "error" && <p className="mt-2 text-sm text-red-600">There was an error — try again later.</p>}
      </div>
    </form>
  );
}