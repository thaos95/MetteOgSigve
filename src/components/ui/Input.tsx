"use client";
import { forwardRef, type InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Error message to display */
  error?: string;
  /** Label text */
  label?: string;
  /** Help text below input */
  helpText?: string;
}

/**
 * Styled input component with optional label and error state.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", error, label, helpText, id, ...props }, ref) => {
    const inputId = id ?? `input-${props.name ?? Math.random().toString(36).slice(2)}`;
    
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-primary mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`input ${error ? "border-error focus:ring-error" : ""} ${className}`}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-sm text-error">
            {error}
          </p>
        )}
        {helpText && !error && (
          <p id={`${inputId}-help`} className="mt-1 text-sm text-warm-gray">
            {helpText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
