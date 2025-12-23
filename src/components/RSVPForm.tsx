"use client";
import { useState } from "react";

export default function RSVPForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [attending, setAttending] = useState(true);
  const [guests, setGuests] = useState(0);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [showExisting, setShowExisting] = useState<any | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/rsvp", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editId ? { name, email, attending, guests, notes, id: editId } : { name, email, attending, guests, notes })
      });

      if (res.ok) {
        setStatus("done");
        setShowExisting(null);
        setEditId(null);
      } else if (res.status === 409) {
        const data = await res.json();
        setStatus("idle");
        // show existing record suggestions (prefill option)
        if (data.existing) {
          setShowExisting(data.existing);
        } else if (data.results) {
          setShowExisting(data.results[0]);
        } else {
          setStatus("error");
        }
      } else {
        setStatus("error");
      }
    } catch (err) {
      setStatus("error");
    }
  }

  async function startEditFromExisting(existing: any) {
    setName(existing.name ?? "");
    setEmail(existing.email ?? "");
    setAttending(!!existing.attending);
    setGuests(existing.guests ?? 0);
    setNotes(existing.notes ?? "");
    setEditId(existing.id);
    setShowExisting(null);
  }

  async function cancelExisting(id: string) {
    if (!confirm('Cancel this RSVP?')) return;
    const res = await fetch(`/api/rsvp/${id}`, { method: 'DELETE' });
    if (res.ok) {
      alert('RSVP cancelled');
      setShowExisting(null);
    } else {
      const d = await res.json();
      alert(d.error ?? 'Failed to cancel');
    }
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
        <button type="submit" className="px-4 py-2 bg-black text-white rounded" disabled={status === "sending"}>{editId ? 'Update RSVP' : 'Send RSVP'}</button>
        {status === "done" && <p className="mt-2 text-sm text-green-600">Thanks — your RSVP has been {editId ? 'updated' : 'submitted'}.</p>}
        {status === "error" && <p className="mt-2 text-sm text-red-600">There was an error — try again later.</p>}
      </div>

      {showExisting && (
        <div className="mt-4 p-3 border rounded bg-yellow-50">
          <div className="text-sm">We found an existing RSVP that may match:</div>
          <div className="mt-2">
            <strong>{showExisting.name}</strong> — {showExisting.email} — {showExisting.attending ? 'Attending' : 'Not attending'} — Guests: {showExisting.guests}
            <div className="mt-2 flex gap-2">
              <button onClick={() => startEditFromExisting(showExisting)} className="px-3 py-1 bg-green-600 text-white rounded">Edit this RSVP</button>
              <button onClick={() => cancelExisting(showExisting.id)} className="px-3 py-1 bg-red-600 text-white rounded">Cancel RSVP</button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}