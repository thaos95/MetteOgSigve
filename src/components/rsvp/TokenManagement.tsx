"use client";
import { useState } from "react";

export interface TokenManagementProps {
  email: string;
  pastedToken: string;
  onTokenChange: (token: string) => void;
  onTokenApplied: (rsvp: any) => void;
  getRecaptchaToken: (action?: string) => Promise<string | undefined>;
}

/**
 * Collapsible section for managing edit/cancel tokens.
 */
export function TokenManagement({
  email,
  pastedToken,
  onTokenChange,
  onTokenApplied,
  getRecaptchaToken,
}: TokenManagementProps) {
  const [sendToEmail, setSendToEmail] = useState("");
  const [updateEmail, setUpdateEmail] = useState(false);

  async function requestToken() {
    if (!email && !sendToEmail) {
      alert("Vennligst skriv inn e-posten din først eller spesifiser en e-post å sende til");
      return;
    }
    const recaptchaToken = await getRecaptchaToken("request-token");
    const body: any = { email, purpose: "edit" };
    if (recaptchaToken) body.recaptchaToken = recaptchaToken;
    if (sendToEmail) body.sendToEmail = sendToEmail;
    if (updateEmail) body.updateEmail = true;
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
        alert("Utviklertoken: " + d.devToken);
        onTokenChange(d.devToken);
      } else {
        alert("En sikker lenke er sendt til e-posten (hvis den finnes i våre registre).");
      }
    } else {
      alert(d.error ?? "Feilet");
    }
  }

  async function verifyToken() {
    if (!pastedToken) {
      alert("Lim inn en token først");
      return;
    }
    try {
      const res = await fetch(`/api/rsvp/verify-token?token=${encodeURIComponent(pastedToken)}`);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error ?? "Ugyldig token");
        return;
      }
      const data = await res.json();
      if (data?.ok && data.rsvp) {
        onTokenApplied(data.rsvp);
        alert("Token lagt til — du kan nå oppdatere svaret ditt");
      }
    } catch {
      alert("Kunne ikke verifisere token");
    }
  }

  async function generateTestToken() {
    const deviceId = (() => {
      try {
        return localStorage.getItem("__device_id");
      } catch {
        return null;
      }
    })();
    const headers: any = { "Content-Type": "application/json" };
    if (deviceId) headers["x-device-id"] = deviceId;
    const res = await fetch("/api/rsvp/generate-test-token", {
      method: "POST",
      headers,
      body: JSON.stringify({ email }),
    });
    const d = await res.json();
    if (res.ok && d?.token) {
      alert("Generert testtoken: " + d.token);
      onTokenChange(d.token);
    } else {
      alert(d.error ?? "Kunne ikke generere testtoken");
    }
  }

  return (
    <details className="mt-8 group">
      <summary className="text-sm text-warm-gray cursor-pointer hover:text-primary transition-colors list-none flex items-center gap-2">
        <svg
          className="w-4 h-4 transform group-open:rotate-90 transition-transform"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        Trenger du å endre eller kansellere et eksisterende svar?
      </summary>
      <div className="mt-4 p-4 bg-cream/30 border border-soft-border rounded-lg space-y-4">
        <p className="text-sm text-warm-gray">
          Skriv inn e-posten din for å motta en sikker endrings-/slettelenke. Du kan valgfritt spesifisere en annen adresse å sende lenken til.
        </p>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="send-to-email" className="block text-sm font-medium text-primary mb-1">
                Send lenke til e-post
              </label>
              <input
                id="send-to-email"
                placeholder="epost@eksempel.no"
                value={sendToEmail}
                onChange={(e) => setSendToEmail(e.target.value)}
                className="input"
                type="email"
              />
            </div>
            <label htmlFor="update-email-checkbox" className="flex items-center gap-2 cursor-pointer pb-2">
              <input
                id="update-email-checkbox"
                type="checkbox"
                checked={updateEmail}
                onChange={(e) => setUpdateEmail(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm text-warm-gray">Oppdater svar-epost</span>
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={requestToken} className="btn-primary text-sm">
              Be om endrings-/slettelenke
            </button>
            {process.env.NODE_ENV !== "production" && (
              <button type="button" onClick={generateTestToken} className="btn-secondary text-sm">
                Generer testtoken (dev)
              </button>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-soft-border">
          <label htmlFor="paste-token" className="block text-sm font-medium text-primary mb-1">
            Eller lim inn token direkte
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              id="paste-token"
              value={pastedToken}
              onChange={(e) => onTokenChange(e.target.value)}
              placeholder="Lim inn token her"
              className="input flex-1 min-w-[200px]"
            />
            <button type="button" onClick={verifyToken} className="btn-secondary text-sm">
              Bruk token
            </button>
          </div>
        </div>
      </div>
    </details>
  );
}

export default TokenManagement;
