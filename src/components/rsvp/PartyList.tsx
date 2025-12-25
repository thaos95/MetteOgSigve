"use client";
import type { PartyMember } from "./GuestRow";
import { GuestRow } from "./GuestRow";

export interface PartyListProps {
  party: PartyMember[];
  onUpdate: (index: number, updates: Partial<PartyMember>) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
  onSetAll: (attending: boolean) => void;
}

/**
 * Guest party list with add/remove/bulk actions.
 */
export function PartyList({ party, onUpdate, onRemove, onAdd, onSetAll }: PartyListProps) {
  return (
    <fieldset className="space-y-4">
      <legend className="text-sm font-medium text-primary">Flere gjester i ditt følge</legend>
      <div className="space-y-3">
        {party.map((p, i) => (
          <GuestRow key={i} guest={p} index={i} onUpdate={onUpdate} onRemove={onRemove} />
        ))}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onAdd} className="btn-secondary text-sm">
            + Legg til gjest
          </button>
          {party.length > 0 && (
            <>
              <button type="button" onClick={() => onSetAll(true)} className="btn-secondary text-sm">
                Alle kommer
              </button>
              <button type="button" onClick={() => onSetAll(false)} className="btn-secondary text-sm">
                Ingen kommer
              </button>
            </>
          )}
        </div>
      </div>
    </fieldset>
  );
}

export default PartyList;
