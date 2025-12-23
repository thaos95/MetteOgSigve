"use client";
import { useState, useEffect } from "react";

export default function RSVPForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [attending, setAttending] = useState(true);
  const [guests, setGuests] = useState(0);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [showExisting, setShowExisting] = useState<any | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [tokenRequested, setTokenRequested] = useState<string | null>(null);
  const [recaptchaReady, setRecaptchaReady] = useState(false);
  
  useEffect(() => {
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
          setName(r.name ?? '');
          setEmail(r.email ?? '');
          setAttending(!!r.attending);
          setGuests(r.guests ?? 0);
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
      const payload = editId ? { name, email, attending, guests, notes, id: editId, token: tokenFromUrl } : { name, email, attending, guests, notes };
      if (recaptchaToken) (payload as any).recaptchaToken = recaptchaToken;
      const res = await fetch(editId ? `/api/rsvp/${editId}` : "/api/rsvp", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
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

      <div className="mt-4 text-sm text-gray-600">
        <div>If you want to receive a secure edit/cancel link by email, enter your <strong>email</strong> and click the button below:</div>
        <div className="mt-2">
          <button onClick={async () => {
            if (!email) { alert('Please enter your email first'); return; }
            const recaptchaToken = await getRecaptchaToken('request-token');
            const body = { email, purpose: 'edit' } as any;
            if (recaptchaToken) body.recaptchaToken = recaptchaToken;
            const res = await fetch('/api/rsvp/request-token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            if (res.ok) { alert('A secure link was sent to your email (if it exists in our records).'); } else { const d = await res.json(); alert(d.error ?? 'Failed'); }
          }} className="px-3 py-2 bg-indigo-600 text-white rounded">Request edit/cancel link</button>
        </div>
      </div>
    </form>
  );
}