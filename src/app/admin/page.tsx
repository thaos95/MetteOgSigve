"use client";
import { useState } from "react";
import AuditLogsViewer from '../../components/AuditLogsViewer';
import AddGuestModal from '../../components/AddGuestModal';
import Toast from '../../components/Toast';
import { ToastProvider, useToast } from '../../components/toast/ToastContext';

function InnerAdminPage() {
  const [password, setPassword] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [rsvps, setRsvps] = useState<any[]>([]);
  const [showAudit, setShowAudit] = useState(false);
  const [showAddGuest, setShowAddGuest] = useState<{ open: boolean; rsvpId?: string | number } | null>(null);
  const { addToast } = useToast();


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
        <div className="mt-4 space-y-4">
          {/* Header section */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-medium text-lg">RSVPs</h3>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setShowAudit(true)} className="px-3 py-2 bg-gray-700 text-white rounded text-sm">Audit logs</button>
              <button onClick={() => fetchAuditLogsQuick()} className="px-3 py-2 bg-gray-600 text-white rounded text-sm">Quick preview</button>
            </div>
          </div>

          {/* Filters section */}
          <details className="border rounded p-3" open>
            <summary className="cursor-pointer font-medium text-sm">Filters</summary>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label htmlFor="filter-attending" className="block text-xs text-gray-600 mb-1">Attending status</label>
                <select id="filter-attending" value={filterAttending} onChange={e => setFilterAttending(e.target.value as any)} className="w-full p-2 border rounded text-sm">
                  <option value="all">All</option>
                  <option value="yes">Attending</option>
                  <option value="no">Not attending</option>
                </select>
              </div>
              <div>
                <label htmlFor="filter-from" className="block text-xs text-gray-600 mb-1">From date</label>
                <input id="filter-from" type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} className="w-full p-2 border rounded text-sm" />
              </div>
              <div>
                <label htmlFor="filter-to" className="block text-xs text-gray-600 mb-1">To date</label>
                <input id="filter-to" type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} className="w-full p-2 border rounded text-sm" />
              </div>
              <div className="flex items-end">
                <label htmlFor="include-unverified" className="flex items-center gap-2">
                  <input id="include-unverified" type="checkbox" checked={includeUnverified} onChange={e => setIncludeUnverified(e.target.checked)} />
                  <span className="text-sm">Include unverified</span>
                </label>
              </div>
              <div>
                <label htmlFor="member-filter" className="block text-xs text-gray-600 mb-1">Member name</label>
                <input id="member-filter" value={memberFilter} onChange={e => setMemberFilter(e.target.value)} placeholder="Filter by name" className="w-full p-2 border rounded text-sm" />
              </div>
              <div>
                <label htmlFor="member-attending-filter" className="block text-xs text-gray-600 mb-1">Member attending</label>
                <select id="member-attending-filter" value={memberAttendingFilter} onChange={e => setMemberAttendingFilter(e.target.value as '' | 'yes' | 'no')} className="w-full p-2 border rounded text-sm">
                  <option value="">Any</option>
                  <option value="yes">Attending</option>
                  <option value="no">Not attending</option>
                </select>
              </div>
            </div>
          </details>

          {/* Export & backup section */}
          <details className="border rounded p-3">
            <summary className="cursor-pointer font-medium text-sm">Export & backup</summary>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={exportCSV} className="px-3 py-2 bg-blue-600 text-white rounded text-sm">Export CSV</button>
              <button onClick={() => emailBackup()} className="px-3 py-2 bg-emerald-600 text-white rounded text-sm">Email backup</button>
              <div className="flex flex-wrap gap-2 items-center">
                <label htmlFor="test-email-input" className="sr-only">Test email recipient</label>
                <input id="test-email-input" value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="recipient (optional)" className="p-2 border rounded text-sm" />
                <button onClick={async () => {
                  const to = testEmail || undefined;
                  const res = await fetch('/api/admin/test-send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password, to }) });
                  const data = await res.json().catch(()=>({}));
                  if (!res.ok) alert(data.error || 'Test send failed'); else alert('Test send queued');
                }} className="px-3 py-2 bg-indigo-600 text-white rounded text-sm">Send test email</button>
              </div>
            </div>
          </details>

          {/* Danger zone section */}
          <details className="border border-red-200 rounded p-3 bg-red-50">
            <summary className="cursor-pointer font-medium text-sm text-red-700">Danger zone</summary>
            <div className="mt-3 space-y-3">
              <div className="flex flex-wrap gap-2 items-center">
                <button onClick={async () => {
                  if (!confirm('This will permanently DELETE all RSVPs. Type DELETE to confirm in the next prompt. Continue?')) return;
                  const answer = prompt('Type DELETE to confirm');
                  if (answer !== 'DELETE') return alert('Cancelled');
                  const res = await fetch('/api/admin/clear-rsvps', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password, confirm: 'DELETE' }) });
                  const data = await res.json().catch(()=>({}));
                  if (!res.ok) alert(data.error || 'Clear failed'); else { alert(`Deleted ${data.deleted ?? 0} RSVPs`); setRsvps([]); }
                }} className="px-3 py-2 bg-red-700 text-white rounded text-sm">Clear all RSVPs</button>
                <button onClick={removeSentinel} className="px-3 py-2 bg-red-600 text-white rounded text-sm">Remove sentinel</button>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <label htmlFor="rlEmailInput" className="sr-only">Email for rate limit operations</label>
                <input id="rlEmailInput" placeholder="email (blank = all)" className="p-2 border rounded text-sm" />
                <button onClick={async () => {
                  const emailInput = (document.getElementById('rlEmailInput') as HTMLInputElement | null)?.value?.trim();
                  if (!emailInput && !confirm('No email provided — clear ALL rate limits?')) return;
                  const body = emailInput ? { password, email: emailInput } : { password, all: true };
                  const res = await fetch('/api/admin/reset-rate-limits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
                  const data = await res.json().catch(()=>({}));
                  if (!res.ok) alert(data.error || 'Reset failed'); else alert('Rate limits reset: ' + JSON.stringify(data));
                }} className="px-3 py-2 bg-orange-600 text-white rounded text-sm">Reset rate limits</button>
                <button onClick={async () => {
                  const emailInput = (document.getElementById('rlEmailInput') as HTMLInputElement | null)?.value?.trim();
                  if (!emailInput) return alert('Enter email to view');
                  const res = await fetch('/api/admin/reset-rate-limits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password, email: emailInput, view: true }) });
                  const data = await res.json().catch(()=>({}));
                  if (!res.ok) alert(data.error || 'View failed'); else alert('Rate limits: ' + JSON.stringify(data));
                }} className="px-3 py-2 bg-yellow-600 text-white rounded text-sm">View rate limits</button>
              </div>
            </div>
          </details>

          {showAddGuest && showAddGuest.open && (
            <AddGuestModal
              open={showAddGuest.open}
              initialFirst={''}
              initialLast={''}
              onClose={() => setShowAddGuest(null)}
              onSave={async (p) => {
                try {
                  const res = await fetch('/api/admin/edit-guest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password, rsvpId: showAddGuest.rsvpId, action: 'add', firstName: p.firstName, lastName: p.lastName, attending: p.attending }) });
                  const d = await res.json(); if (!res.ok) return alert(d.error || 'Failed to add guest');
                  setRsvps(rsvps.map(x => x.id === d.rsvp.id ? d.rsvp : x));
                  // show success toast
                  addToast({ message: 'Guest added', variant: 'success' });
                } catch (e) { alert('Failed to add guest'); }
              }}
            />
          )}
          {showAudit && authorized && <AuditLogsViewer password={password} onClose={() => setShowAudit(false)} />}

          {showAudit && authorized && <AuditLogsViewer password={password} onClose={() => setShowAudit(false)} />}
          <ul className="mt-2 space-y-2">
            {rsvps
              .filter(r => {
                if (!memberFilter && !memberAttendingFilter) return true;                const mf = memberFilter ? String(memberFilter).toLowerCase() : null;
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
                      <button onClick={() => { setShowAddGuest({ open: true, rsvpId: r.id }); }} className="mt-2 px-3 py-1 bg-green-600 text-white rounded text-sm">Add guest</button>
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

export default function AdminPage() {
  return (
    <ToastProvider>
      <InnerAdminPage />
    </ToastProvider>
  );
}