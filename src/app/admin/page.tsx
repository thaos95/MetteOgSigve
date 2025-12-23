"use client";
import { useState } from "react";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [rsvps, setRsvps] = useState<any[]>([]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/admin/rsvps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      const data = await res.json();
      setRsvps(data.rsvps ?? []);
      setAuthorized(true);
    } else {
      alert("Unauthorized");
    }
  }

  async function createTable(e: React.FormEvent) {
    e?.preventDefault();
    if (!confirm("Create the 'rsvps' table? This action is idempotent and will be disabled after success.")) return;
    const res = await fetch(`/api/admin/create-rsvps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (res.ok) {
      alert(data.message ?? 'Created');
    } else {
      alert(data.error ?? 'Failed to create table');
    }
  }

  async function removeSentinel(e?: React.FormEvent) {
    e?.preventDefault();
    if (!confirm('Remove sentinel file? This allows the create endpoint to be run again.')) return;
    const res = await fetch('/api/admin/remove-sentinel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (res.ok) alert(data.message ?? 'Removed'); else alert(data.error ?? 'Failed');
  }

  async function exportCSV(e?: React.FormEvent) {
    e?.preventDefault();
    const res = await fetch('/api/admin/export-rsvps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) { const data = await res.json(); alert(data.error ?? 'Export failed'); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rsvps.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <h2 className="text-2xl font-medium">Admin</h2>
      {!authorized ? (
        <div className="mt-4">
          <form onSubmit={login} className="mt-2">
            <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Admin password" className="p-2 border rounded" />
            <button className="ml-2 px-3 py-2 bg-black text-white rounded">Login</button>
          </form>

          <div className="mt-4">
            <p className="text-sm text-gray-600">You can create the `rsvps` table here if it doesn't exist.</p>
            <button onClick={createTable} className="mt-2 px-3 py-2 bg-gray-800 text-white rounded">Create table</button>
            <button onClick={removeSentinel} className="ml-2 mt-2 px-3 py-2 bg-red-600 text-white rounded">Remove sentinel</button>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">RSVPs</h3>
            <div>
              <button onClick={exportCSV} className="px-3 py-2 bg-blue-600 text-white rounded">Export CSV</button>
              <button onClick={removeSentinel} className="ml-2 px-3 py-2 bg-red-600 text-white rounded">Remove sentinel</button>
            </div>
          </div>

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