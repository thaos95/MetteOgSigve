"use client";
import { type ReactNode, useEffect, useCallback } from "react";

export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Called when the modal should close */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal content */
  children: ReactNode;
  /** Additional class for the modal container */
  className?: string;
  /** Icon to show in title area */
  icon?: ReactNode;
  /** Accent color for border */
  accentColor?: "accent" | "error" | "success";
}

const accentColorClasses = {
  accent: "border-accent/30 bg-accent/5",
  error: "border-error/30 bg-error/5",
  success: "border-success/30 bg-success/5",
};

/**
 * Modal/dialog component with backdrop.
 * Used for duplicate warnings, confirmations, etc.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className = "",
  icon,
  accentColor = "accent",
}: ModalProps) {
  // Close on escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className={`mt-6 p-5 border-2 rounded-xl ${accentColorClasses[accentColor]} ${className}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
        )}
        <div className="flex-1">
          {title && (
            <h4 id="modal-title" className="font-serif text-lg text-primary mb-1">
              {title}
            </h4>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;
