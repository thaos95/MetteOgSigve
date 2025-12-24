"use client";
import type { PartyMember } from "./GuestRow";

export interface ExistingRsvp {
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  attending?: boolean;
  party?: PartyMember[];
}

export interface DuplicateModalProps {
  existing: ExistingRsvp;
  onEdit: (existing: ExistingRsvp) => void;
  onCancel: (id: string) => void;
  onCreateAnyway: () => void;
}

/**
 * Warning modal shown when a duplicate RSVP is detected.
 */
export function DuplicateModal({ existing, onEdit, onCancel, onCreateAnyway }: DuplicateModalProps) {
  const displayName = existing.name ?? `${existing.first_name} ${existing.last_name}`;
  const partyMembers = existing.party && Array.isArray(existing.party) ? existing.party : [];

  return (
    <div className="mt-6 p-5 border-2 border-accent/30 rounded-xl bg-accent/5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="font-serif text-lg text-primary mb-1">Existing RSVP Found</h4>
          <p className="text-sm text-warm-gray mb-3">We found an RSVP that might be yours:</p>
          <div className="bg-white/60 rounded-lg p-3 mb-4">
            <p className="font-medium text-primary">{displayName}</p>
            <p className="text-sm text-warm-gray">{existing.email}</p>
            <div className="mt-2 text-sm">
              <span className="text-warm-gray">Party:</span>
              <ul className="ml-4 mt-1 space-y-0.5">
                <li className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${existing.attending ? "bg-success" : "bg-error"}`}
                  />
                  {existing.first_name} {existing.last_name}
                </li>
                {partyMembers.map((p, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${p.attending ? "bg-success" : "bg-error"}`} />
                    {p.firstName} {p.lastName}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => onEdit(existing)} className="btn-primary text-sm">
              Edit this RSVP
            </button>
            <button type="button" onClick={() => onCancel(existing.id)} className="btn-danger text-sm">
              Cancel RSVP
            </button>
            <button type="button" onClick={onCreateAnyway} className="btn-secondary text-sm">
              Create new anyway
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DuplicateModal;
