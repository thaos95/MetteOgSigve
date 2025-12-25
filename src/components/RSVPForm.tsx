"use client";
import { useState, useEffect } from "react";
import { AttendingSelector } from "./rsvp/AttendingSelector";
import { PartyList } from "./rsvp/PartyList";
import { GuestRow, type PartyMember } from "./rsvp/GuestRow";
import { DuplicateModal, type ExistingRsvp } from "./rsvp/DuplicateModal";
import { SuccessState, ErrorState, type FormStatus } from "./rsvp/FormStates";
import { TokenManagement } from "./rsvp/TokenManagement";

/**
 * Main RSVP submission form.
 * 
 * Refactored to use sub-components for maintainability.
 * Previously 492 lines, now delegates to:
 * - AttendingSelector (attendance radio)
 * - PartyList (guest list management)
 * - DuplicateModal (duplicate RSVP warning)
 * - FormStates (success/error states)
 * - TokenManagement (edit token handling)
 */
export default function RSVPForm() {
  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [attending, setAttending] = useState(true);
  const [party, setParty] = useState<PartyMember[]>([]);
  const [notes, setNotes] = useState("");
  
  // UI state
  const [status, setStatus] = useState<FormStatus>("idle");
  const [showExisting, setShowExisting] = useState<ExistingRsvp | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [pastedToken, setPastedToken] = useState<string>("");
  const [recaptchaReady, setRecaptchaReady] = useState(false);

  // Initialize device ID and recaptcha
  useEffect(() => {
    try {
      const existing = localStorage.getItem("__device_id");
      if (!existing) {
        const id =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem("__device_id", id);
      }
    } catch {
      /* ignore */
    }

    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (!siteKey) return;
    const s = document.createElement("script");
    s.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    s.async = true;
    s.defer = true;
    s.onload = () => setRecaptchaReady(true);
    document.head.appendChild(s);
  }, []);

  async function getRecaptchaToken(action = "rsvp") {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (!siteKey || !(window as any).grecaptcha) return undefined;
    try {
      await (window as any).grecaptcha.ready();
      return await (window as any).grecaptcha.execute(siteKey, { action });
    } catch (e) {
      console.error("recaptcha execute error", e);
      return undefined;
    }
  }

  // Check for token in URL on load
  useEffect(() => {
    async function checkToken() {
      try {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");
        if (!token) return;
        const res = await fetch(`/api/rsvp/verify-token?token=${encodeURIComponent(token)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data?.ok && data.rsvp) {
          applyRsvpData(data.rsvp);
          setEditId(data.rsvp.id);
          setPastedToken(token);
        }
      } catch {
        // ignore
      }
    }
    checkToken();
  }, []);

  function applyRsvpData(r: any) {
    setFirstName(r.first_name ?? (r.name ? String(r.name).split(/\s+/)[0] : ""));
    setLastName(r.last_name ?? (r.name ? String(r.name).split(/\s+/).slice(-1).join(" ") : ""));
    setEmail(r.email ?? "");
    setAttending(!!r.attending);
    setParty(Array.isArray(r.party) ? r.party : r.party ? JSON.parse(r.party) : []);
    setNotes(r.notes ?? "");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get("token");
      const tokenToUse = pastedToken || tokenFromUrl || null;

      const recaptchaToken = await getRecaptchaToken(editId ? "edit" : "rsvp");
      const payload: any = editId ? { id: editId, token: tokenToUse } : {};
      payload.firstName = firstName;
      payload.lastName = lastName;
      payload.email = email;
      payload.attending = attending;
      payload.party = party;
      payload.notes = notes;
      if (recaptchaToken) payload.recaptchaToken = recaptchaToken;

      let deviceId: string | null = null;
      try {
        deviceId = localStorage.getItem("__device_id");
      } catch {
        /* ignore */
      }
      const headers: any = { "Content-Type": "application/json" };
      if (deviceId) headers["x-device-id"] = deviceId;

      const res = await fetch(editId ? `/api/rsvp/${editId}` : "/api/rsvp", {
        method: editId ? "PUT" : "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setStatus("done");
        setShowExisting(null);
        setEditId(null);
      } else if (res.status === 409) {
        const data = await res.json();
        setStatus("idle");
        if (data.existing) {
          setShowExisting(data.existing);
        } else if (data.results) {
          setShowExisting(data.results[0]);
        } else {
          setStatus("error");
        }
      } else if (res.status === 401) {
        const data = await res.json().catch(() => ({}));
        if (data.error?.includes("token required") || data.error?.includes("adminPassword")) {
          setStatus("idle");
          alert(
            'For å oppdatere svaret ditt trenger du en sikker lenke. Vennligst utvid "Trenger du å endre eller kansellere et eksisterende svar?" nedenfor og be om en endringslenke.'
          );
        } else {
          setStatus("error");
        }
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  async function startEditFromExisting(existing: ExistingRsvp) {
    applyRsvpData(existing);
    setEditId(existing.id);
    setShowExisting(null);

    // Auto-request token if email available
    if (!pastedToken && existing.email) {
      try {
        const recaptchaToken = await getRecaptchaToken("request-token");
        const body: any = { email: existing.email, purpose: "edit" };
        if (recaptchaToken) body.recaptchaToken = recaptchaToken;
        const deviceId = (() => {
          try {
            return localStorage.getItem("__device_id");
          } catch {
            return null;
          }
        })();
        const headers: any = { "Content-Type": "application/json" };
        if (deviceId) headers["x-device-id"] = deviceId;
        const res = await fetch("/api/rsvp/request-token", {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });
        const d = await res.json().catch(() => ({}));
        if (res.ok) {
          if (d?.devToken) {
            setPastedToken(d.devToken);
            alert("Utviklermodus: Endringstoken lagt til automatisk. Du kan nå oppdatere svaret ditt.");
          } else {
            alert(
              `Vi har sendt en sikker lenke til ${existing.email}. Vennligst sjekk innboksen din og klikk på lenken for å fullføre endringen.`
            );
            setEditId(null);
          }
        } else {
          alert(d.error ?? "Kunne ikke be om endringslenke. Vennligst prøv igjen.");
          setEditId(null);
        }
      } catch (e) {
        console.error("Failed to request edit token", e);
        alert("Kunne ikke be om endringslenke. Vennligst prøv igjen.");
        setEditId(null);
      }
    } else if (!existing.email) {
      alert("Dette svaret har ingen e-post registrert. Vennligst kontakt oss direkte for å gjøre endringer.");
      setEditId(null);
    }
  }

  async function cancelExisting(id: string) {
    if (!confirm("Kansellere dette svaret?")) return;
    const body: any = {};
    if (pastedToken) body.token = pastedToken;
    const res = await fetch(`/api/rsvp/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      alert("Svar slettet");
      setShowExisting(null);
    } else {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "Kunne ikke slette");
    }
  }

  async function createNewAnyway() {
    try {
      const payload: any = { firstName, lastName, email, attending, party, notes, overrideDuplicate: true };
      const deviceId = (() => {
        try {
          return localStorage.getItem("__device_id");
        } catch {
          return null;
        }
      })();
      const headers: any = { "Content-Type": "application/json" };
      if (deviceId) headers["x-device-id"] = deviceId;
      const res = await fetch("/api/rsvp", { method: "POST", headers, body: JSON.stringify(payload) });
      if (res.ok) {
        setStatus("done");
        setShowExisting(null);
      } else {
        const d = await res.json();
        alert(d.error || "Feilet");
      }
    } catch {
      alert("Feilet");
    }
  }

  // Party management handlers
  const handleUpdateGuest = (index: number, updates: Partial<PartyMember>) => {
    setParty(party.map((p, i) => (i === index ? { ...p, ...updates } : p)));
  };

  const handleRemoveGuest = (index: number) => {
    setParty(party.filter((_, i) => i !== index));
  };

  const handleAddGuest = () => {
    setParty([...party, { firstName: "", lastName: "", attending: true }]);
  };

  const handleSetAllAttending = (attending: boolean) => {
    setParty(party.map((p) => ({ ...p, attending })));
  };

  // Token applied from TokenManagement
  const handleTokenApplied = (rsvp: any) => {
    applyRsvpData(rsvp);
    setEditId(rsvp.id);
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Success State */}
      {status === "done" && <SuccessState wasEdit={!!editId} />}

      {/* Error State */}
      {status === "error" && <ErrorState />}

      {status !== "done" && (
        <>
          {/* Name Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="first-name" className="block text-sm font-medium text-primary mb-2">
                Fornavn
              </label>
              <input
                id="first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="input"
                required
                placeholder="Ditt fornavn"
              />
            </div>
            <div>
              <label htmlFor="last-name" className="block text-sm font-medium text-primary mb-2">
                Etternavn
              </label>
              <input
                id="last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="input"
                required
                placeholder="Ditt etternavn"
              />
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-primary mb-2">
              E-post
            </label>
            <input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              type="email"
              placeholder="din@epost.no"
            />
          </div>

          {/* Attending Radio Group */}
          <AttendingSelector attending={attending} onChange={setAttending} />

          {/* Additional Guests */}
          <PartyList
            party={party}
            onUpdate={handleUpdateGuest}
            onRemove={handleRemoveGuest}
            onAdd={handleAddGuest}
            onSetAll={handleSetAllAttending}
          />

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-primary mb-2">
              Melding{" "}
              <span className="font-normal text-warm-gray">(allergier, etc.)</span>
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input min-h-[100px] resize-y"
              rows={4}
              placeholder="Gi oss beskjed om det er noe vi bør vite..."
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              className="btn-primary w-full text-lg py-4"
              disabled={status === "sending"}
            >
              {status === "sending" ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Sender...
                </span>
              ) : editId ? (
                "Oppdater svar"
              ) : (
                "Send svar"
              )}
            </button>
          </div>
        </>
      )}

      {/* Existing RSVP Found Modal */}
      {showExisting && (
        <DuplicateModal
          existing={showExisting}
          onEdit={startEditFromExisting}
          onCancel={cancelExisting}
          onCreateAnyway={createNewAnyway}
        />
      )}

      {/* Token Management Section */}
      <TokenManagement
        email={email}
        pastedToken={pastedToken}
        onTokenChange={setPastedToken}
        onTokenApplied={handleTokenApplied}
        getRecaptchaToken={getRecaptchaToken}
      />
    </form>
  );
}
