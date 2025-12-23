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

  const [filterAttending, setFilterAttending] = useState<'all'|'yes'|'no'>('all');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [includeUnverified, setIncludeUnverified] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  async function exportCSV(e?: React.FormEvent) {
    e?.preventDefault();
    const res = await fetch('/api/admin/export-rsvps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, attending: filterAttending, from: filterFrom || undefined, to: filterTo || undefined, include_unverified: includeUnverified }),
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

  async function emailBackup() {
    const res = await fetch('/api/admin/email-rsvps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, to: process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'metteogsigve@gmail.com' }),
    });
    const data = await res.json();
    if (!res.ok) alert(data.error ?? 'Email backup failed'); else alert('Backup sent');
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
            <p className="text-sm text-gray-600">Table creation is disabled for safety. Use the Supabase SQL editor or remove the sentinel to enable creation again.</p>
            <button onClick={removeSentinel} className="mt-2 px-3 py-2 bg-red-600 text-white rounded">Remove sentinel</button>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">RSVPs</h3>
            <div className="flex items-center gap-2">
              <select value={filterAttending} onChange={e => setFilterAttending(e.target.value as any)} className="p-2 border rounded">
                <option value="all">All</option>
                <option value="yes">Attending</option>
                <option value="no">Not attending</option>
              </select>
              <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} className="p-2 border rounded" />
              <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} className="p-2 border rounded" />
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={includeUnverified} onChange={e => setIncludeUnverified(e.target.checked)} />
                <span className="text-sm">Include unverified</span>
              </label>
              <button onClick={exportCSV} className="px-3 py-2 bg-blue-600 text-white rounded">Export CSV</button>
              <button onClick={() => emailBackup()} className="ml-2 px-3 py-2 bg-emerald-600 text-white rounded">Send backup (email)</button>
              {/* Test send email */}
              <div className="ml-2 flex items-center gap-2">
                <input value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="recipient (optional)" className="p-2 border rounded" />
                <button onClick={async () => {
                  const to = testEmail || undefined;
                  const res = await fetch('/api/admin/test-send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password, to }) });
                  const data = await res.json().catch(()=>({}));
                  if (!res.ok) alert(data.error || 'Test send failed'); else alert('Test send queued');
                }} className="px-3 py-2 bg-indigo-600 text-white rounded">Send test email</button>
              </div>
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