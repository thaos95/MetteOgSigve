"use client";
import { useState } from "react";
import AuditLogsViewer from '../../components/AuditLogsViewer';
import Toast from '../../components/Toast';
import { ToastProvider, useToast } from '../../components/toast/ToastContext';

/**
 * Admin Dashboard
 * 
 * SIMPLIFIED MODEL (2024):
 * - One person per RSVP (no party management)
 * - No verified/unverified distinction (all RSVPs are confirmed on creation)
 */
function InnerAdminPage() {
  const [password, setPassword] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [rsvps, setRsvps] = useState<any[]>([]);
  const [showAudit, setShowAudit] = useState(false);
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
  const [testEmail, setTestEmail] = useState('');
  const [memberFilter, setMemberFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');

  // Compute dashboard stats (simplified - no verification distinction)
  const stats = {
    total: rsvps.length,
    attending: rsvps.filter(r => r.attending).length,
    notAttending: rsvps.filter(r => !r.attending).length,
    withEmail: rsvps.filter(r => r.email).length,
    withoutEmail: rsvps.filter(r => !r.email).length,
  };

  async function exportCSV(e?: React.FormEvent) {
    e?.preventDefault();
    const res = await fetch('/api/admin/export-rsvps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, attending: filterAttending, from: filterFrom || undefined, to: filterTo || undefined, person_name: memberFilter || undefined }),
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
      body: JSON.stringify({ password, to: process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'metteogsigve@gmail.com', person_name: memberFilter || undefined }),
    });
    const data = await res.json();
    if (!res.ok) alert(data.error ?? 'Email backup failed'); else alert('Backup sent');
  }

  async function fetchAuditLogsQuick() {
    try {
      const res = await fetch('/api/admin/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, limit: 50 })
      });
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
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Admin password" className="p-2 border rounded" />
            <button className="ml-2 px-3 py-2 bg-black text-white rounded">Login</button>
          </form>

          <div className="mt-4">
            <p className="text-sm text-gray-600">Table creation is disabled for safety. Use the Supabase SQL editor or remove the sentinel to enable creation again.</p>
            <button onClick={removeSentinel} className="mt-2 px-3 py-2 bg-red-600 text-white rounded">Remove sentinel</button>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {/* Dashboard Stats (simplified) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="p-3 bg-blue-50 rounded border border-blue-200">
              <div className="text-2xl font-bold text-blue-700">{stats.total}</div>
              <div className="text-xs text-blue-600">Total RSVPs</div>
            </div>
            <div className="p-3 bg-green-50 rounded border border-green-200">
              <div className="text-2xl font-bold text-green-700">{stats.attending}</div>
              <div className="text-xs text-green-600">Attending</div>
            </div>
            <div className="p-3 bg-red-50 rounded border border-red-200">
              <div className="text-2xl font-bold text-red-700">{stats.notAttending}</div>
              <div className="text-xs text-red-600">Not Attending</div>
            </div>
            <div className="p-3 bg-emerald-50 rounded border border-emerald-200">
              <div className="text-2xl font-bold text-emerald-700">{stats.withEmail}</div>
              <div className="text-xs text-emerald-600">With Email</div>
            </div>
            <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-700">{stats.withoutEmail}</div>
              <div className="text-xs text-yellow-600">No Email</div>
            </div>
          </div>

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
              <div>
                <label htmlFor="member-filter" className="block text-xs text-gray-600 mb-1">Name</label>
                <input id="member-filter" value={memberFilter} onChange={e => setMemberFilter(e.target.value)} placeholder="Filter by name" className="w-full p-2 border rounded text-sm" />
              </div>
              <div>
                <label htmlFor="email-filter" className="block text-xs text-gray-600 mb-1">Email</label>
                <input id="email-filter" value={emailFilter} onChange={e => setEmailFilter(e.target.value)} placeholder="Filter by email" className="w-full p-2 border rounded text-sm" />
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

          {showAudit && authorized && <AuditLogsViewer password={password} onClose={() => setShowAudit(false)} />}

          <ul className="mt-2 space-y-2">
            {rsvps
              .filter(r => {
                // Email filter
                if (emailFilter) {
                  const ef = emailFilter.toLowerCase();
                  if (!String(r.email || '').toLowerCase().includes(ef)) return false;
                }
                // Name filter
                if (memberFilter) {
                  const mf = memberFilter.toLowerCase();
                  const fullName = `${r.first_name || ''} ${r.last_name || ''} ${r.name || ''}`.toLowerCase();
                  if (!fullName.includes(mf)) return false;
                }
                return true;
              })
              .map(r => {
              return (
                <li key={r.id} className="p-3 border rounded">
                  <div className="flex items-center justify-between">
                    <div>
                      <strong>{r.name || `${r.first_name} ${r.last_name}`}</strong>
                      {r.email ? (
                        <span className="text-gray-600 ml-2">— {r.email}</span>
                      ) : (
                        <span className="text-yellow-600 ml-2 text-sm">(ingen e-post)</span>
                      )}
                    </div>
                    <div className={`px-2 py-1 rounded text-sm ${r.attending ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {r.attending ? 'Kommer' : 'Kommer ikke'}
                    </div>
                  </div>
                  {r.notes && (
                    <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      {r.notes}
                    </div>
                  )}
                  <div className="mt-2 text-xs text-gray-400">
                    Registrert: {new Date(r.created_at).toLocaleString('nb-NO')}
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
