"use client";

export interface ExistingRsvp {
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  attending?: boolean;
}

export interface DuplicateModalProps {
  existing: ExistingRsvp;
  onEdit: (existing: ExistingRsvp) => void;
  onCancel: (id: string) => void;
  onCreateAnyway: () => void;
}

/**
 * Warning modal shown when a duplicate RSVP is detected.
 * SIMPLIFIED: No party members display (one person per RSVP).
 */
export function DuplicateModal({ existing, onEdit, onCancel, onCreateAnyway }: DuplicateModalProps) {
  const displayName = existing.name ?? `${existing.first_name} ${existing.last_name}`;

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
          <h4 className="font-serif text-lg text-primary mb-1">Eksisterende svar funnet</h4>
          <p className="text-sm text-warm-gray mb-3">Vi fant et svar som kan være ditt:</p>
          <div className="bg-white/60 rounded-lg p-3 mb-4">
            <p className="font-medium text-primary">{displayName}</p>
            {existing.email && <p className="text-sm text-warm-gray">{existing.email}</p>}
            <div className="mt-2 text-sm flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${existing.attending ? "bg-success" : "bg-error"}`}
              />
              <span className="text-warm-gray">
                {existing.attending ? "Kommer" : "Kommer ikke"}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => onEdit(existing)} className="btn-primary text-sm">
              Endre dette svaret
            </button>
            <button type="button" onClick={() => onCancel(existing.id)} className="btn-danger text-sm">
              Slett svar
            </button>
            <button type="button" onClick={onCreateAnyway} className="btn-secondary text-sm">
              Opprett nytt likevel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DuplicateModal;
