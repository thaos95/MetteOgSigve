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
  const [memberFilter, setMemberFilter] = useState('');
  const [memberAttendingFilter, setMemberAttendingFilter] = useState<'' | 'yes' | 'no'>('');

  async function exportCSV(e?: React.FormEvent) {
    e?.preventDefault();
    const res = await fetch('/api/admin/export-rsvps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, attending: filterAttending, from: filterFrom || undefined, to: filterTo || undefined, include_unverified: includeUnverified, include_party_rows: true, person_name: memberFilter || undefined, person_attending: memberAttendingFilter || undefined }),
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
      body: JSON.stringify({ password, to: process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'metteogsigve@gmail.com', include_party_rows: true, person_name: memberFilter || undefined, person_attending: memberAttendingFilter || undefined }),
    });
    const data = await res.json();
    if (!res.ok) alert(data.error ?? 'Email backup failed'); else alert('Backup sent');
  }

  async function fetchAuditLogsQuick() {
    try {
      const res = await fetch(`/api/admin/audit-logs?password=${encodeURIComponent(password)}&limit=50`);
      const data = await res.json().catch(()=>({}));
      if (!res.ok) { alert(data.error || 'Failed to fetch logs'); return; }
      const logs = data.logs || [];
      if (!logs.length) return alert('No logs');
      const preview = logs.slice(0,10).map((l:any)=>`${new Date(l.created_at).toLocaleString()} • ${l.admin_email} • ${l.action} • ${l.target_table}/${l.target_id}`).join('\n');
      alert(preview);
    } catch (e:any) { alert('Failed to fetch logs: ' + (e?.message || String(e))); }
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

              <div className="flex items-center gap-2">
                <input value={memberFilter} onChange={e => setMemberFilter(e.target.value)} placeholder="Filter by member name" className="p-2 border rounded" />
                <select value={memberAttendingFilter} onChange={e => setMemberAttendingFilter(e.target.value as '' | 'yes' | 'no')} className="p-2 border rounded">
                  <option value="">Member attending (any)</option>
                  <option value="yes">Member attending</option>
                  <option value="no">Member not attending</option>
                </select>
              </div>

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

              {/* Clear RSVPs (dangerous) */}
              <div className="ml-2">
                <button onClick={async () => {
                  if (!confirm('This will permanently DELETE all RSVPs. Type DELETE to confirm in the next prompt. Continue?')) return;
                  const answer = prompt('Type DELETE to confirm');
                  if (answer !== 'DELETE') return alert('Cancelled');
                  const res = await fetch('/api/admin/clear-rsvps', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password, confirm: 'DELETE' }) });
                  const data = await res.json().catch(()=>({}));
                  if (!res.ok) alert(data.error || 'Clear failed'); else { alert(`Deleted ${data.deleted ?? 0} RSVPs`); setRsvps([]); }
                }} className="ml-2 px-3 py-2 bg-red-700 text-white rounded">Clear all RSVPs</button>
              </div>

              {/* Reset rate limits */}
              <div className="ml-2 flex items-center gap-2">
                <input placeholder="email (leave blank to clear all)" className="p-2 border rounded" id="rlEmailInput" />
                <button onClick={async () => {
                  const emailInput = (document.getElementById('rlEmailInput') as HTMLInputElement | null)?.value?.trim();
                  if (!emailInput && !confirm('No email provided — clear ALL rate limits?')) return;
                  const body = emailInput ? { password, email: emailInput } : { password, all: true };
                  const res = await fetch('/api/admin/reset-rate-limits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
                  const data = await res.json().catch(()=>({}));
                  if (!res.ok) alert(data.error || 'Reset failed'); else alert('Rate limits reset: ' + JSON.stringify(data));
                }} className="ml-2 px-3 py-2 bg-orange-600 text-white rounded">Reset rate limits</button>
                <button onClick={async () => {
                  const emailInput = (document.getElementById('rlEmailInput') as HTMLInputElement | null)?.value?.trim();
                  if (!emailInput) return alert('Enter email to view');
                  const res = await fetch('/api/admin/reset-rate-limits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password, email: emailInput, view: true }) });
                  const data = await res.json().catch(()=>({}));
                  if (!res.ok) alert(data.error || 'View failed'); else alert('Rate limits: ' + JSON.stringify(data));
                }} className="ml-2 px-3 py-2 bg-yellow-600 text-white rounded">View rate limits</button>
              </div>

              <button onClick={removeSentinel} className="ml-2 px-3 py-2 bg-red-600 text-white rounded">Remove sentinel</button>
              <button onClick={() => fetchAuditLogsQuick()} className="ml-2 px-3 py-2 bg-gray-700 text-white rounded">View audit logs (quick)</button>
            </div>
          </div>

          <ul className="mt-2 space-y-2">
            {rsvps
              .filter(r => {
                if (!memberFilter && !memberAttendingFilter) return true;
                const mf = memberFilter ? String(memberFilter).toLowerCase() : null;
                let party: any[] = [];
                try { if (Array.isArray(r.party)) party = r.party; else if (r.party && typeof r.party === 'string') party = JSON.parse(r.party); } catch (e) { party = []; }
                const people = [{ firstName: r.first_name || (r.name ? String(r.name).split(/\s+/)[0] : ''), lastName: r.last_name || (r.name ? String(r.name).split(/\s+/).slice(-1).join(' ') : ''), attending: !!r.attending }, ...party.map((p:any)=>({ firstName: p.firstName||p.first_name||'', lastName: p.lastName||p.last_name||'', attending: p.attending!==undefined?!!p.attending:!!r.attending }))];
                if (mf) {
                  const found = people.some(p => (String(p.firstName||'') + ' ' + String(p.lastName||'')).toLowerCase().includes(mf));
                  if (!found) return false;
                }
                if (memberAttendingFilter === 'yes') {
                  const found = people.some(p => p.attending);
                  if (!found) return false;
                }
                if (memberAttendingFilter === 'no') {
                  const found = people.every(p => !p.attending);
                  if (!found) return false;
                }
                return true;
              })
              .map(r => {
              // normalize party field (could be array or JSON string or null)
              let party: Array<any> = [];
              try {
                if (Array.isArray(r.party)) party = r.party;
                else if (r.party && typeof r.party === 'string') party = JSON.parse(r.party);
              } catch (e) { party = []; }
              return (
                <li key={r.id} className="p-2 border rounded">
                  <div className="flex items-center justify-between">
                    <div>
                      <strong>{r.name}</strong> — {r.email} — {r.attending ? 'Attending' : 'Not attending'}
                      <div className="text-sm text-gray-600 mt-1">{r.notes}</div>
                    </div>
                    <div className="text-sm text-gray-700">Party size: {1 + (party?.length || 0)}</div>
                  </div>

                  <div className="mt-2">
                    <div className="text-sm font-medium">Party members:</div>
                    <ul className="ml-4 list-disc text-sm">
                      <li>{r.first_name ?? r.name?.split(/\s+/)[0]} {r.last_name ?? r.name?.split(/\s+/).slice(-1).join(' ')} — {r.attending ? 'Attending' : 'Not attending'}
                        <button onClick={async () => {
                          // toggle primary attending
                          const res = await fetch('/api/admin/update-person', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password, rsvpId: r.id, target: 'primary', attending: !r.attending }) });
                          const d = await res.json();
                          if (!res.ok) alert(d.error || 'Failed'); else {
                            setRsvps(rsvps.map(x => x.id === r.id ? d.rsvp : x));
                            alert('Updated');
                          }
                        }} className="ml-2 px-2 py-1 bg-gray-200 rounded text-xs">Toggle primary</button>
                      </li>
                      {party && party.length > 0 ? party.map((p: any, i: number) => (
                        <li key={i} className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <input value={(p.firstName ?? p.first_name) || ''} onChange={e => setRsvps(rsvps.map(x => x.id === r.id ? { ...x, party: (x.party||[]).map((pp:any,ii:number)=>ii===i?{...pp,firstName:e.target.value}:pp) } : x))} className="p-1 border rounded w-32" />
                              <input value={(p.lastName ?? p.last_name) || ''} onChange={e => setRsvps(rsvps.map(x => x.id === r.id ? { ...x, party: (x.party||[]).map((pp:any,ii:number)=>ii===i?{...pp,lastName:e.target.value}:pp) } : x))} className="p-1 border rounded w-32" />
                              <label className="flex items-center gap-1"><input type="checkbox" checked={!!p.attending} onChange={e => setRsvps(rsvps.map(x => x.id === r.id ? { ...x, party: (x.party||[]).map((pp:any,ii:number)=>ii===i?{...pp,attending:e.target.checked}:pp) } : x))} /> Attending</label>
                            </div>
                            <div className="mt-1 text-xs text-gray-500">Edit fields above then use Save/Move/Remove</div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <button onClick={async () => {
                              // save edit
                              const guest = (r.party||[])[i];
                              const res = await fetch('/api/admin/edit-guest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password, rsvpId: r.id, action: 'update', index: i, firstName: guest.firstName ?? guest.first_name, lastName: guest.lastName ?? guest.last_name, attending: !!guest.attending }) });
                              const d = await res.json(); if (!res.ok) alert(d.error || 'Failed'); else { setRsvps(rsvps.map(x => x.id === r.id ? d.rsvp : x)); alert('Saved'); }
                            }} className="px-2 py-1 bg-blue-600 text-white rounded text-xs">Save</button>
                            <button onClick={async () => {
                              // move up
                              const res = await fetch('/api/admin/edit-guest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password, rsvpId: r.id, action: 'move', index: i, dir: 'up' }) });
                              const d = await res.json(); if (!res.ok) alert(d.error || 'Failed'); else { setRsvps(rsvps.map(x => x.id === r.id ? d.rsvp : x)); }
                            }} className="px-2 py-1 bg-gray-200 rounded text-xs">↑</button>
                            <button onClick={async () => {
                              // move down
                              const res = await fetch('/api/admin/edit-guest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password, rsvpId: r.id, action: 'move', index: i, dir: 'down' }) });
                              const d = await res.json(); if (!res.ok) alert(d.error || 'Failed'); else { setRsvps(rsvps.map(x => x.id === r.id ? d.rsvp : x)); }
                            }} className="px-2 py-1 bg-gray-200 rounded text-xs">↓</button>
                            <button onClick={async () => {
                              if (!confirm('Remove this guest?')) return;
                              const res = await fetch('/api/admin/edit-guest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password, rsvpId: r.id, action: 'remove', index: i }) });
                              const d = await res.json(); if (!res.ok) alert(d.error || 'Failed'); else { setRsvps(rsvps.map(x => x.id === r.id ? d.rsvp : x)); }
                            }} className="px-2 py-1 bg-red-600 text-white rounded text-xs">Remove</button>
                          </div>
                        </li>
                      )) : <li className="text-sm text-gray-500">No additional guests</li>}
                    <div className="mt-2">
                      <button onClick={async () => {
                        // add guest UI: prompt for name (simple)
                        const first = prompt('First name for new guest') || '';
                        const last = prompt('Last name for new guest') || '';
                        if (!first && !last) return;
                        const res = await fetch('/api/admin/edit-guest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password, rsvpId: r.id, action: 'add', firstName: first, lastName: last, attending: true }) });
                        const d = await res.json(); if (!res.ok) alert(d.error || 'Failed'); else { setRsvps(rsvps.map(x => x.id === r.id ? d.rsvp : x)); }
                      }} className="mt-2 px-3 py-1 bg-green-600 text-white rounded text-sm">Add guest</button>
                    </div>
                    </ul>
                  </div>

                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}