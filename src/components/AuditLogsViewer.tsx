"use client";
import React, { useEffect, useState } from 'react';

type LogRow = {
  id: number;
  admin_email: string;
  action: string;
  target_table?: string | null;
  target_id?: string | null;
  ip?: string | null;
  device_id?: string | null;
  metadata?: any;
  before?: any;
  after?: any;
  created_at: string;
};

export default function AuditLogsViewer({ password, onClose }: { password: string; onClose: () => void }) {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [limit] = useState(25);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<LogRow | null>(null);
  const [filterAction, setFilterAction] = useState('');
  const [filterAdmin, setFilterAdmin] = useState('');

  async function fetchPage(p = 0) {
    setLoading(true);
    try {
      const offset = p * limit;
      const body: any = { password, limit, offset };
      if (filterAction) body.action = filterAction;
      if (filterAdmin) body.adminEmail = filterAdmin;
      const res = await fetch('/api/admin/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const js = await res.json();
      if (!res.ok) throw new Error(js?.error || 'Failed');
      setLogs(js.logs || []);
      setTotal(js.count || js.logs.length || 0);
      setPage(p);
    } catch (e) {
      console.error('fetch logs failed', e);
      alert('Failed to fetch logs');
    } finally { setLoading(false); }
  }

  useEffect(() => { fetchPage(0); }, [filterAction, filterAdmin]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-start justify-center p-6 z-50">
      <div className="bg-white w-full max-w-4xl rounded shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-medium">Admin Audit Logs</h3>
          <div className="flex items-center gap-2">
            <input value={filterAdmin} onChange={e => setFilterAdmin(e.target.value)} placeholder="Filter admin email" className="p-2 border rounded" />
            <input value={filterAction} onChange={e => setFilterAction(e.target.value)} placeholder="Filter action" className="p-2 border rounded" />
            <button onClick={() => fetchPage(0)} className="px-3 py-1 bg-blue-600 text-white rounded">Filter</button>
            <button onClick={() => onClose()} className="px-3 py-1 bg-gray-200 rounded">Close</button>
          </div>
        </div>

        <div className="p-4">
          <div className="text-sm text-gray-600 mb-2">Showing {logs.length} of {total} logs</div>
          <div className="overflow-auto max-h-[60vh]">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b"><th className="p-2">Time</th><th className="p-2">Admin</th><th className="p-2">Action</th><th className="p-2">Target</th><th className="p-2">IP</th><th className="p-2">Device</th><th className="p-2">Details</th></tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 align-top">{new Date(l.created_at).toLocaleString()}</td>
                    <td className="p-2 align-top">{l.admin_email}</td>
                    <td className="p-2 align-top">{l.action}</td>
                    <td className="p-2 align-top">{l.target_table}/{l.target_id}</td>
                    <td className="p-2 align-top">{l.ip}</td>
                    <td className="p-2 align-top">{l.device_id}</td>
                    <td className="p-2 align-top"><button onClick={() => setSelected(l)} className="px-2 py-1 bg-gray-200 rounded text-xs">View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button disabled={page <= 0} onClick={() => fetchPage(page - 1)} className="px-3 py-1 bg-gray-200 rounded">Prev</button>
              <button disabled={(page + 1) * limit >= total} onClick={() => fetchPage(page + 1)} className="px-3 py-1 bg-gray-200 rounded">Next</button>
            </div>
            <div className="text-sm text-gray-600">Page {page + 1} • {Math.max(1, Math.ceil(total / limit))} pages</div>
          </div>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 flex items-center justify-center">
          <div className="bg-white p-4 rounded shadow max-w-2xl w-full">
            <div className="flex justify-between items-center mb-2">
              <strong>Audit detail</strong>
              <button onClick={() => setSelected(null)} className="px-2 py-1 bg-gray-200 rounded">Close</button>
            </div>
            <div className="text-xs text-gray-600 mb-2">{selected.admin_email} • {selected.action} • {new Date(selected.created_at).toLocaleString()}</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="font-medium">Before</div>
                <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-auto">{JSON.stringify(selected.before, null, 2)}</pre>
              </div>
              <div>
                <div className="font-medium">After</div>
                <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-auto">{JSON.stringify(selected.after, null, 2)}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
