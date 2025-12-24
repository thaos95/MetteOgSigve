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
  const [pastedToken, setPastedToken] = useState<string>('');
  const [sendToEmail, setSendToEmail] = useState<string>('');
  const [updateEmail, setUpdateEmail] = useState<boolean>(false);
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
          // also store pasted token for UI convenience
          setPastedToken(token);
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
      const tokenToUse = pastedToken || tokenFromUrl || null;

      const recaptchaToken = await getRecaptchaToken(editId ? 'edit' : 'rsvp');
      const payload: any = editId ? { id: editId, token: tokenToUse } : {};
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
      } else if (res.status === 401) {
        // Token required for edit - guide user
        const data = await res.json().catch(() => ({}));
        if (data.error?.includes('token required') || data.error?.includes('adminPassword')) {
          setStatus("idle");
          alert('To update your RSVP, you need a secure link. Please expand "Need to edit or cancel an existing RSVP?" below and request an edit link.');
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
    // Prefill the form with existing data
    setFirstName(existing.first_name ?? (existing.name ? String(existing.name).split(/\s+/)[0] : ""));
    setLastName(existing.last_name ?? (existing.name ? String(existing.name).split(/\s+/).slice(-1).join(' ') : ""));
    setEmail(existing.email ?? "");
    setAttending(!!existing.attending);
    setParty(Array.isArray(existing.party) ? existing.party : (existing.party ? JSON.parse(existing.party) : []));
    setNotes(existing.notes ?? "");
    setEditId(existing.id);
    setShowExisting(null);
    
    // IMPORTANT: When editing from duplicate detection, user needs a token.
    // If no token yet, automatically request one and guide the user.
    if (!pastedToken) {
      const email = existing.email;
      if (email) {
        // Auto-request edit token to the RSVP email
        try {
          const recaptchaToken = await getRecaptchaToken('request-token');
          const body: any = { email, purpose: 'edit' };
          if (recaptchaToken) body.recaptchaToken = recaptchaToken;
          const deviceId = (() => { try { return localStorage.getItem('__device_id'); } catch (e) { return null; } })();
          const headers: any = { 'Content-Type': 'application/json' };
          if (deviceId) headers['x-device-id'] = deviceId;
          const res = await fetch('/api/rsvp/request-token', { method: 'POST', headers, body: JSON.stringify(body) });
          const d = await res.json().catch(() => ({}));
          if (res.ok) {
            if (d?.devToken) {
              // Dev mode: auto-apply token
              setPastedToken(d.devToken);
              alert('Development mode: Edit token applied automatically. You can now update your RSVP.');
            } else {
              alert(`We've sent a secure link to ${email}. Please check your inbox and click the link to complete your edit.`);
              // Clear edit mode since they need to come back via token link
              setEditId(null);
            }
          } else {
            alert(d.error ?? 'Could not request edit link. Please try again.');
            setEditId(null);
          }
        } catch (e) {
          console.error('Failed to request edit token', e);
          alert('Could not request edit link. Please try again.');
          setEditId(null);
        }
      } else {
        alert('This RSVP has no email on record. Please contact us directly to make changes.');
        setEditId(null);
      }
    }
  }

  async function cancelExisting(id: string) {
    if (!confirm('Cancel this RSVP?')) return;
    const body: any = {};
    if (pastedToken) body.token = pastedToken;
    const res = await fetch(`/api/rsvp/${id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) {
      alert('RSVP cancelled');
      setShowExisting(null);
    } else {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? 'Failed to cancel');
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Success State */}
      {status === "done" && (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="font-serif text-2xl text-primary mb-2">Thank you!</h3>
          <p className="text-warm-gray">
            Your RSVP has been {editId ? 'updated' : 'submitted'} successfully.
          </p>
          <p className="text-sm text-warm-gray mt-4">
            We can't wait to celebrate with you.
          </p>
        </div>
      )}

      {/* Error State */}
      {status === "error" && (
        <div className="bg-error/5 border border-error/20 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-error/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-error">Something went wrong</p>
              <p className="text-sm text-warm-gray">Please try again later or contact us directly.</p>
            </div>
          </div>
        </div>
      )}

      {status !== "done" && (
        <>
          {/* Name Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="first-name" className="block text-sm font-medium text-primary mb-2">First name</label>
              <input id="first-name" value={firstName} onChange={e => setFirstName(e.target.value)} className="input" required placeholder="Your first name" />
            </div>
            <div>
              <label htmlFor="last-name" className="block text-sm font-medium text-primary mb-2">Last name</label>
              <input id="last-name" value={lastName} onChange={e => setLastName(e.target.value)} className="input" required placeholder="Your last name" />
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-primary mb-2">Email</label>
            <input id="email" value={email} onChange={e => setEmail(e.target.value)} className="input" type="email" placeholder="your@email.com" />
          </div>

          {/* Attending Radio Group */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-primary">Will you be attending?</legend>
            <div className="flex items-center gap-6">
              <label htmlFor="attending-yes" className="flex items-center gap-2 cursor-pointer group">
                <input id="attending-yes" type="radio" name="attending" checked={attending} onChange={() => setAttending(true)} className="w-4 h-4 text-primary accent-primary" />
                <span className="text-warm-gray group-hover:text-primary transition-colors">Joyfully attending</span>
              </label>
              <label htmlFor="attending-no" className="flex items-center gap-2 cursor-pointer group">
                <input id="attending-no" type="radio" name="attending" checked={!attending} onChange={() => setAttending(false)} className="w-4 h-4 text-primary accent-primary" />
                <span className="text-warm-gray group-hover:text-primary transition-colors">Regretfully declining</span>
              </label>
            </div>
          </fieldset>

          {/* Additional Guests */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-medium text-primary">Additional guests in your party</legend>
            <div className="space-y-3">
              {party.map((p, i) => (
                <div key={i} className="p-4 bg-cream/50 border border-soft-border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-warm-gray">Guest {i + 1}</span>
                    <button type="button" aria-label={`Remove guest ${i + 1}`} onClick={() => setParty(party.filter((_, idx) => idx !== i))} className="btn-danger text-sm px-3 py-1">Remove</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="sr-only" htmlFor={`guest-${i}-first`}>Guest {i + 1} first name</label>
                      <input id={`guest-${i}-first`} className="input" value={p.firstName} onChange={e => setParty(party.map((pp, idx) => idx === i ? { ...pp, firstName: e.target.value } : pp))} placeholder="First name" />
                    </div>
                    <div>
                      <label className="sr-only" htmlFor={`guest-${i}-last`}>Guest {i + 1} last name</label>
                      <input id={`guest-${i}-last`} className="input" value={p.lastName} onChange={e => setParty(party.map((pp, idx) => idx === i ? { ...pp, lastName: e.target.value } : pp))} placeholder="Last name" />
                    </div>
                  </div>
                  <label htmlFor={`guest-${i}-attending`} className="flex items-center gap-2 cursor-pointer">
                    <input id={`guest-${i}-attending`} type="checkbox" checked={!!p.attending} onChange={e => setParty(party.map((pp, idx) => idx === i ? { ...pp, attending: e.target.checked } : pp))} className="w-4 h-4 accent-primary" />
                    <span className="text-sm text-warm-gray">Attending</span>
                  </label>
                </div>
              ))}
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setParty([...party, { firstName: '', lastName: '', attending: true }])} className="btn-secondary text-sm">+ Add guest</button>
                {party.length > 0 && (
                  <>
                    <button type="button" onClick={() => setParty(party.map(p => ({ ...p, attending: true })))} className="btn-secondary text-sm">All attending</button>
                    <button type="button" onClick={() => setParty(party.map(p => ({ ...p, attending: false })))} className="btn-secondary text-sm">All not attending</button>
                  </>
                )}
              </div>
            </div>
          </fieldset>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-primary mb-2">Notes <span className="font-normal text-warm-gray">(dietary requirements, song requests, etc.)</span></label>
            <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} className="input min-h-[100px] resize-y" rows={4} placeholder="Let us know if there's anything we should know..." />
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button type="submit" className="btn-primary w-full text-lg py-4" disabled={status === "sending"}>
              {status === "sending" ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sending...
                </span>
              ) : (editId ? 'Update RSVP' : 'Send RSVP')}
            </button>
          </div>
        </>
      )}

      {/* Existing RSVP Found Modal */}
      {showExisting && (
        <div className="mt-6 p-5 border-2 border-accent/30 rounded-xl bg-accent/5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-serif text-lg text-primary mb-1">Existing RSVP Found</h4>
              <p className="text-sm text-warm-gray mb-3">We found an RSVP that might be yours:</p>
              <div className="bg-white/60 rounded-lg p-3 mb-4">
                <p className="font-medium text-primary">{showExisting.name ?? `${showExisting.first_name} ${showExisting.last_name}`}</p>
                <p className="text-sm text-warm-gray">{showExisting.email}</p>
                <div className="mt-2 text-sm">
                  <span className="text-warm-gray">Party:</span>
                  <ul className="ml-4 mt-1 space-y-0.5">
                    <li className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${showExisting.attending ? 'bg-success' : 'bg-error'}`}></span>
                      {showExisting.first_name} {showExisting.last_name}
                    </li>
                    {(showExisting.party && Array.isArray(showExisting.party) ? showExisting.party : []).map((p: any, i: number) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${p.attending ? 'bg-success' : 'bg-error'}`}></span>
                        {p.firstName} {p.lastName}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => startEditFromExisting(showExisting)} className="btn-primary text-sm">Edit this RSVP</button>
                <button type="button" onClick={() => cancelExisting(showExisting.id)} className="btn-danger text-sm">Cancel RSVP</button>
                <button type="button" onClick={async () => {
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
                }} className="btn-secondary text-sm">Create new anyway</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Token Management Section */}
      <details className="mt-8 group">
        <summary className="text-sm text-warm-gray cursor-pointer hover:text-primary transition-colors list-none flex items-center gap-2">
          <svg className="w-4 h-4 transform group-open:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Need to edit or cancel an existing RSVP?
        </summary>
        <div className="mt-4 p-4 bg-cream/30 border border-soft-border rounded-lg space-y-4">
          <p className="text-sm text-warm-gray">
            Enter your email to receive a secure edit/cancel link. You can optionally specify a different address to send the link to.
          </p>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 items-end">
              <div className="flex-1 min-w-[200px]">
                <label htmlFor="send-to-email" className="block text-sm font-medium text-primary mb-1">Send link to email</label>
                <input id="send-to-email" placeholder="email@example.com" value={sendToEmail} onChange={e => setSendToEmail(e.target.value)} className="input" type="email" />
              </div>
              <label htmlFor="update-email-checkbox" className="flex items-center gap-2 cursor-pointer pb-2">
                <input id="update-email-checkbox" type="checkbox" checked={updateEmail} onChange={e => setUpdateEmail(e.target.checked)} className="w-4 h-4 accent-primary" />
                <span className="text-sm text-warm-gray">Update RSVP email</span>
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={async () => {
                if (!email && !sendToEmail) { alert('Please enter your email first or specify an email to send to'); return; }
                const recaptchaToken = await getRecaptchaToken('request-token');
                const body = { email, purpose: 'edit' } as any;
                if (recaptchaToken) body.recaptchaToken = recaptchaToken;
                if (sendToEmail) body.sendToEmail = sendToEmail;
                if (updateEmail) body.updateEmail = true;
                const deviceId = (() => { try { return localStorage.getItem('__device_id'); } catch (e) { return null; } })();
                const headers: any = { 'Content-Type': 'application/json' };
                if (deviceId) headers['x-device-id'] = deviceId;
                const res = await fetch('/api/rsvp/request-token', { method: 'POST', headers, body: JSON.stringify(body) });
                const d = await res.json().catch(() => ({}));
                if (res.ok) {
                  if (d?.devToken) {
                    alert('Development token: ' + d.devToken);
                    setPastedToken(d.devToken);
                  } else {
                    alert('A secure link was sent to the target email (if it exists in our records).');
                  }
                } else { alert(d.error ?? 'Failed'); }
              }} className="btn-primary text-sm">Request edit/cancel link</button>

              {process.env.NODE_ENV !== 'production' && (
                <button type="button" onClick={async () => {
                  const deviceId = (() => { try { return localStorage.getItem('__device_id'); } catch (e) { return null; } })();
                  const headers: any = { 'Content-Type': 'application/json' };
                  if (deviceId) headers['x-device-id'] = deviceId;
                  const res = await fetch('/api/rsvp/generate-test-token', { method: 'POST', headers, body: JSON.stringify({ email }) });
                  const d = await res.json();
                  if (res.ok && d?.token) {
                    alert('Generated test token: ' + d.token);
                    setPastedToken(d.token);
                  } else {
                    alert(d.error ?? 'Failed to generate test token');
                  }
                }} className="btn-secondary text-sm">Generate test token (dev)</button>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-soft-border">
            <label htmlFor="paste-token" className="block text-sm font-medium text-primary mb-1">Or paste your token directly</label>
            <div className="flex flex-wrap gap-2">
              <input id="paste-token" value={pastedToken} onChange={e => setPastedToken(e.target.value)} placeholder="Paste token here" className="input flex-1 min-w-[200px]" />
              <button type="button" onClick={async () => {
                if (!pastedToken) { alert('Paste a token first'); return; }
                try {
                  const res = await fetch(`/api/rsvp/verify-token?token=${encodeURIComponent(pastedToken)}`);
                  if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.error ?? 'Invalid token'); return; }
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
                    setTokenRequested(pastedToken);
                    alert('Token applied — you can now update your RSVP');
                  }
                } catch (e) { alert('Failed to verify token'); }
              }} className="btn-secondary text-sm">Use token</button>
            </div>
          </div>
        </div>
      </details>
    </form>
  );
}