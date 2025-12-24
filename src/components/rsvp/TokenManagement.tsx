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
      alert("Please enter your email first or specify an email to send to");
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
        alert("Development token: " + d.devToken);
        onTokenChange(d.devToken);
      } else {
        alert("A secure link was sent to the target email (if it exists in our records).");
      }
    } else {
      alert(d.error ?? "Failed");
    }
  }

  async function verifyToken() {
    if (!pastedToken) {
      alert("Paste a token first");
      return;
    }
    try {
      const res = await fetch(`/api/rsvp/verify-token?token=${encodeURIComponent(pastedToken)}`);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error ?? "Invalid token");
        return;
      }
      const data = await res.json();
      if (data?.ok && data.rsvp) {
        onTokenApplied(data.rsvp);
        alert("Token applied — you can now update your RSVP");
      }
    } catch {
      alert("Failed to verify token");
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
      alert("Generated test token: " + d.token);
      onTokenChange(d.token);
    } else {
      alert(d.error ?? "Failed to generate test token");
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
        Need to edit or cancel an existing RSVP?
      </summary>
      <div className="mt-4 p-4 bg-cream/30 border border-soft-border rounded-lg space-y-4">
        <p className="text-sm text-warm-gray">
          Enter your email to receive a secure edit/cancel link. You can optionally specify a different
          address to send the link to.
        </p>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="send-to-email" className="block text-sm font-medium text-primary mb-1">
                Send link to email
              </label>
              <input
                id="send-to-email"
                placeholder="email@example.com"
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
              <span className="text-sm text-warm-gray">Update RSVP email</span>
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={requestToken} className="btn-primary text-sm">
              Request edit/cancel link
            </button>
            {process.env.NODE_ENV !== "production" && (
              <button type="button" onClick={generateTestToken} className="btn-secondary text-sm">
                Generate test token (dev)
              </button>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-soft-border">
          <label htmlFor="paste-token" className="block text-sm font-medium text-primary mb-1">
            Or paste your token directly
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              id="paste-token"
              value={pastedToken}
              onChange={(e) => onTokenChange(e.target.value)}
              placeholder="Paste token here"
              className="input flex-1 min-w-[200px]"
            />
            <button type="button" onClick={verifyToken} className="btn-secondary text-sm">
              Use token
            </button>
          </div>
        </div>
      </div>
    </details>
  );
}

export default TokenManagement;
