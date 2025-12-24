"use client";

export interface PartyMember {
  firstName: string;
  lastName: string;
  attending?: boolean;
}

export interface GuestRowProps {
  guest: PartyMember;
  index: number;
  onUpdate: (index: number, updates: Partial<PartyMember>) => void;
  onRemove: (index: number) => void;
}

/**
 * A single guest row in the party list.
 */
export function GuestRow({ guest, index, onUpdate, onRemove }: GuestRowProps) {
  return (
    <div className="p-4 bg-cream/50 border border-soft-border rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-warm-gray">Guest {index + 1}</span>
        <button
          type="button"
          aria-label={`Remove guest ${index + 1}`}
          onClick={() => onRemove(index)}
          className="btn-danger text-sm px-3 py-1"
        >
          Remove
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="sr-only" htmlFor={`guest-${index}-first`}>
            Guest {index + 1} first name
          </label>
          <input
            id={`guest-${index}-first`}
            className="input"
            value={guest.firstName}
            onChange={(e) => onUpdate(index, { firstName: e.target.value })}
            placeholder="First name"
          />
        </div>
        <div>
          <label className="sr-only" htmlFor={`guest-${index}-last`}>
            Guest {index + 1} last name
          </label>
          <input
            id={`guest-${index}-last`}
            className="input"
            value={guest.lastName}
            onChange={(e) => onUpdate(index, { lastName: e.target.value })}
            placeholder="Last name"
          />
        </div>
      </div>
      <label htmlFor={`guest-${index}-attending`} className="flex items-center gap-2 cursor-pointer">
        <input
          id={`guest-${index}-attending`}
          type="checkbox"
          checked={!!guest.attending}
          onChange={(e) => onUpdate(index, { attending: e.target.checked })}
          className="w-4 h-4 accent-primary"
        />
        <span className="text-sm text-warm-gray">Attending</span>
      </label>
    </div>
  );
}

export default GuestRow;
