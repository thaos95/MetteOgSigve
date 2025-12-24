"use client";
import { useState, useEffect } from "react";

export default function RSVPForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [attending, setAttending] = useState(true);
  const [party, setParty] = useState<Array<{ firstName: string; lastName: string; attending?: boolean }>>([]);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [showExisting, setShowExisting] = useState<any | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [tokenRequested, setTokenRequested] = useState<string | null>(null);
  const [recaptchaReady, setRecaptchaReady] = useState(false);
  
  useEffect(() => {
    // ensure device id exists for layered rate limits
    try {
      const existing = localStorage.getItem('__device_id');
      if (!existing) {
        const id = (crypto as any)?.randomUUID ? (crypto as any).randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem('__device_id', id);
      }
    } catch (e) { /* ignore */ }

    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (!siteKey) return;
    const s = document.createElement('script');
    s.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    s.async = true;
    s.defer = true;
    s.onload = () => setRecaptchaReady(true);
    document.head.appendChild(s);
  }, []);

  async function getRecaptchaToken(action = 'rsvp') {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (!siteKey || !(window as any).grecaptcha) return undefined;
    try {
      await (window as any).grecaptcha.ready();
      const token = await (window as any).grecaptcha.execute(siteKey, { action });
      return token;
    } catch (e) { console.error('recaptcha execute error', e); return undefined; }
  }

  useEffect(() => {
    // If page has token param, verify and prefill automatically
    async function checkToken() {
      try {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        if (!token) return;
        const res = await fetch(`/api/rsvp/verify-token?token=${encodeURIComponent(token)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data?.ok && data.rsvp) {
          const r = data.rsvp;
          setFirstName(r.first_name ?? (r.name ? String(r.name).split(/\s+/)[0] : ''));
          setLastName(r.last_name ?? (r.name ? String(r.name).split(/\s+/).slice(-1).join(' ') : ''));
          setEmail(r.email ?? '');
          setAttending(!!r.attending);
          setParty(Array.isArray(r.party) ? r.party : (r.party ? JSON.parse(r.party) : []));
          setNotes(r.notes ?? '');
          setEditId(r.id);
          // keep token in URL for submit flow
          setTokenRequested(token);
        }
      } catch (e) {
        // ignore
      }
    }
    checkToken();
  }, []);


  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      // If token is present in URL, include it to allow update/cancel without admin
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get('token');

      const recaptchaToken = await getRecaptchaToken(editId ? 'edit' : 'rsvp');
      const payload: any = editId ? { id: editId, token: tokenFromUrl } : {};
      payload.firstName = firstName;
      payload.lastName = lastName;
      payload.email = email;
      payload.attending = attending;
      payload.party = party;
      payload.notes = notes;
      if (recaptchaToken) payload.recaptchaToken = recaptchaToken;

      // include device id header for layered rate limits
      let deviceId: string | null = null;
      try { deviceId = localStorage.getItem('__device_id'); } catch (e) { /* ignore */ }
      const headers: any = { "Content-Type": "application/json" };
      if (deviceId) headers['x-device-id'] = deviceId;
      const res = await fetch(editId ? `/api/rsvp/${editId}` : "/api/rsvp", {
        method: editId ? "PUT" : "POST",
        headers,
        body: JSON.stringify(payload)
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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm">First name</label>
          <input value={firstName} onChange={e => setFirstName(e.target.value)} className="mt-1 w-full p-2 border rounded" required />
        </div>
        <div>
          <label className="block text-sm">Last name</label>
          <input value={lastName} onChange={e => setLastName(e.target.value)} className="mt-1 w-full p-2 border rounded" required />
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm">Email</label>
        <input value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full p-2 border rounded" type="email" />
      </div>

      <div className="flex items-center gap-4 mt-4">
        <label className="flex items-center gap-2">
          <input type="radio" checked={attending} onChange={() => setAttending(true)} /> Attending
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" checked={!attending} onChange={() => setAttending(false)} /> Not attending
        </label>
      </div>

      <div className="mt-4">
        <label className="block text-sm">Guest list</label>
        <div className="mt-2 space-y-2">
          {party.map((p, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input className="p-2 border rounded w-1/3" value={p.firstName} onChange={e => setParty(party.map((pp, idx) => idx === i ? { ...pp, firstName: e.target.value } : pp))} placeholder="First" />
              <input className="p-2 border rounded w-1/3" value={p.lastName} onChange={e => setParty(party.map((pp, idx) => idx === i ? { ...pp, lastName: e.target.value } : pp))} placeholder="Last" />
              <label className="flex items-center gap-1">
                <input type="checkbox" checked={!!p.attending} onChange={e => setParty(party.map((pp, idx) => idx === i ? { ...pp, attending: e.target.checked } : pp))} /> Attending
              </label>
              <button type="button" onClick={() => setParty(party.filter((_, idx) => idx !== i))} className="px-2 py-1 bg-red-600 text-white rounded">Remove</button>
            </div>
          ))}
          <div>
            <button type="button" onClick={() => setParty([...party, { firstName: '', lastName: '', attending: true }])} className="px-3 py-1 bg-gray-200 rounded">Add guest</button>
            <button type="button" onClick={() => setParty(party.map(p => ({ ...p, attending: true })))} className="ml-2 px-3 py-1 bg-gray-200 rounded">Mark all attending</button>
            <button type="button" onClick={() => setParty(party.map(p => ({ ...p, attending: false })))} className="ml-2 px-3 py-1 bg-gray-200 rounded">Mark all not attending</button>
          </div>
        </div>
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
            <strong>{showExisting.name ?? `${showExisting.first_name} ${showExisting.last_name}`}</strong> — {showExisting.email}
            <div className="mt-2 text-sm">Party:</div>
            <ul className="ml-4 list-disc text-sm">
              <li>{showExisting.first_name} {showExisting.last_name} — {showExisting.attending ? 'Attending' : 'Not attending'}</li>
              {(showExisting.party && Array.isArray(showExisting.party) ? showExisting.party : []).map((p: any, i: number) => (
                <li key={i}>{p.firstName} {p.lastName} — {p.attending ? 'Attending' : 'Not attending'}</li>
              ))}
            </ul>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => startEditFromExisting(showExisting)} className="px-3 py-1 bg-green-600 text-white rounded">Edit this RSVP</button>
              <button type="button" onClick={() => cancelExisting(showExisting.id)} className="px-3 py-1 bg-red-600 text-white rounded">Cancel RSVP</button>
              <button type="button" onClick={async () => {
                // create new anyway by resubmitting with overrideDuplicate
                try {
                  const payload: any = { firstName, lastName, email, attending, party, notes, overrideDuplicate: true };
                  const deviceId = (() => { try { return localStorage.getItem('__device_id'); } catch (e) { return null; } })();
                  const headers: any = { 'Content-Type': 'application/json' };
                  if (deviceId) headers['x-device-id'] = deviceId;
                  const res = await fetch('/api/rsvp', { method: 'POST', headers, body: JSON.stringify(payload) });
                  if (res.ok) {
                    setStatus('done');
                    setShowExisting(null);
                  } else {
                    const d = await res.json(); alert(d.error || 'Failed');
                  }
                } catch (e) { alert('Failed'); }
              }} className="px-3 py-1 bg-blue-600 text-white rounded">Create new anyway</button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600">
        <div>If you want to receive a secure edit/cancel link by email, enter your <strong>email</strong> and click the button below:</div>
        <div className="mt-2">
          <button onClick={async () => {
            if (!email) { alert('Please enter your email first'); return; }
            const recaptchaToken = await getRecaptchaToken('request-token');
            const body = { email, purpose: 'edit' } as any;
            if (recaptchaToken) body.recaptchaToken = recaptchaToken;
            const deviceId = (() => { try { return localStorage.getItem('__device_id'); } catch (e) { return null; } })();
            const headers: any = { 'Content-Type': 'application/json' };
            if (deviceId) headers['x-device-id'] = deviceId;
            const res = await fetch('/api/rsvp/request-token', { method: 'POST', headers, body: JSON.stringify(body) });
            if (res.ok) { alert('A secure link was sent to your email (if it exists in our records).'); } else { const d = await res.json(); alert(d.error ?? 'Failed'); }
          }} className="px-3 py-2 bg-indigo-600 text-white rounded">Request edit/cancel link</button>
        </div>
      </div>
    </form>
  );
}