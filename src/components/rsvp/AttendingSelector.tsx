"use client";

export interface AttendingSelectorProps {
  attending: boolean;
  onChange: (attending: boolean) => void;
}

/**
 * Radio group for selecting attendance status.
 */
export function AttendingSelector({ attending, onChange }: AttendingSelectorProps) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-primary">Will you be attending?</legend>
      <div className="flex items-center gap-6">
        <label htmlFor="attending-yes" className="flex items-center gap-2 cursor-pointer group">
          <input
            id="attending-yes"
            type="radio"
            name="attending"
            checked={attending}
            onChange={() => onChange(true)}
            className="w-4 h-4 text-primary accent-primary"
          />
          <span className="text-warm-gray group-hover:text-primary transition-colors">
            Joyfully attending
          </span>
        </label>
        <label htmlFor="attending-no" className="flex items-center gap-2 cursor-pointer group">
          <input
            id="attending-no"
            type="radio"
            name="attending"
            checked={!attending}
            onChange={() => onChange(false)}
            className="w-4 h-4 text-primary accent-primary"
          />
          <span className="text-warm-gray group-hover:text-primary transition-colors">
            Regretfully declining
          </span>
        </label>
      </div>
    </fieldset>
  );
}

export default AttendingSelector;
