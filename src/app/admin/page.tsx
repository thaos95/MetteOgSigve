"use client";
import { useState } from "react";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [rsvps, setRsvps] = useState<any[]>([]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/admin/rsvps?password=${encodeURIComponent(password)}`);
    if (res.ok) {
      const data = await res.json();
      setRsvps(data.rsvps ?? []);
      setAuthorized(true);
    } else {
      alert("Unauthorized");
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-medium">Admin</h2>
      {!authorized ? (
        <form onSubmit={login} className="mt-4">
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Admin password" className="p-2 border rounded" />
          <button className="ml-2 px-3 py-2 bg-black text-white rounded">Login</button>
        </form>
      ) : (
        <div className="mt-4">
          <h3 className="font-medium">RSVPs</h3>
          <ul className="mt-2 space-y-2">
            {rsvps.map(r => (
              <li key={r.id} className="p-2 border rounded">
                <strong>{r.name}</strong> — {r.email} — {r.attending ? 'Attending' : 'Not attending'} — Guests: {r.guests}
                <div className="text-sm text-gray-600 mt-1">{r.notes}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}