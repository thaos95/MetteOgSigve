"use client";

export type FormStatus = "idle" | "sending" | "done" | "error";

export interface SuccessStateProps {
  wasEdit: boolean;
}

/**
 * Success message shown after RSVP is submitted.
 */
export function SuccessState({ wasEdit }: SuccessStateProps) {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center">
        <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="font-serif text-2xl text-primary mb-2">Thank you!</h3>
      <p className="text-warm-gray">Your RSVP has been {wasEdit ? "updated" : "submitted"} successfully.</p>
      <p className="text-sm text-warm-gray mt-4">We can't wait to celebrate with you.</p>
    </div>
  );
}

/**
 * Error state shown when submission fails.
 */
export function ErrorState() {
  return (
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
  );
}
