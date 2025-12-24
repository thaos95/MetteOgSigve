/**
 * Centralized error handling for API routes.
 * 
 * Usage:
 *   import { AppError, errorResponse, ErrorCode } from '@/lib/errors';
 *   
 *   // In route handler:
 *   throw new AppError('VALIDATION_ERROR', 'Invalid email', 400);
 *   
 *   // Or use helper:
 *   return errorResponse(new AppError('NOT_FOUND', 'RSVP not found', 404));
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/**
 * Standard error codes used across the API.
 */
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'RATE_LIMITED'
  | 'DUPLICATE'
  | 'CONFLICT'
  | 'EXPIRED'
  | 'INTERNAL';

/**
 * HTTP status codes for each error type.
 */
export const ERROR_STATUS_CODES: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  RATE_LIMITED: 429,
  DUPLICATE: 409,
  CONFLICT: 409,
  EXPIRED: 410,
  INTERNAL: 500,
};

/**
 * Custom error class with structured error code and details.
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly status: number;
  public readonly details?: Record<string, string[]>;
  public readonly headers?: Record<string, string>;

  constructor(
    code: ErrorCode,
    message: string,
    options?: {
      status?: number;
      details?: Record<string, string[]>;
      headers?: Record<string, string>;
    }
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = options?.status ?? ERROR_STATUS_CODES[code];
    this.details = options?.details;
    this.headers = options?.headers;
  }

  /**
   * Create a validation error from field-level issues.
   */
  static validation(message: string, details?: Record<string, string[]>): AppError {
    return new AppError('VALIDATION_ERROR', message, { details });
  }

  /**
   * Create a not found error.
   */
  static notFound(resource: string): AppError {
    return new AppError('NOT_FOUND', `${resource} not found`);
  }

  /**
   * Create an unauthorized error.
   */
  static unauthorized(message = 'Unauthorized'): AppError {
    return new AppError('UNAUTHORIZED', message);
  }

  /**
   * Create a rate limited error with Retry-After header.
   */
  static rateLimited(retryAfterSeconds: number, context?: string): AppError {
    const msg = context ? `Rate limit exceeded (${context})` : 'Rate limit exceeded';
    return new AppError('RATE_LIMITED', msg, {
      headers: { 'Retry-After': String(retryAfterSeconds) },
    });
  }

  /**
   * Create a duplicate/conflict error.
   */
  static duplicate(message: string): AppError {
    return new AppError('DUPLICATE', message);
  }
}

/**
 * Standard API response shape.
 */
export type ApiResponse<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: { code: ErrorCode; message: string; details?: Record<string, string[]> } };

/**
 * Create a successful JSON response.
 */
export function successResponse<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ ok: true, data }, { status });
}

/**
 * Create an error JSON response from an AppError.
 */
export function errorResponse(err: AppError): NextResponse<ApiResponse<never>> {
  const headers: Record<string, string> = {};
  if (err.headers) {
    Object.assign(headers, err.headers);
  }

  return NextResponse.json(
    {
      ok: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
      },
    },
    { status: err.status, headers }
  );
}

/**
 * Convert a ZodError to an AppError with field-level details.
 */
export function zodToAppError(zodError: ZodError): AppError {
  const details: Record<string, string[]> = {};
  
  for (const issue of zodError.issues) {
    const path = issue.path.join('.') || '_root';
    if (!details[path]) {
      details[path] = [];
    }
    details[path].push(issue.message);
  }

  return AppError.validation('Validation failed', details);
}

/**
 * Helper to handle unknown errors and convert to AppError.
 * Logs the error and returns a safe internal error response.
 */
export function handleUnknownError(err: unknown, context?: string): AppError {
  if (err instanceof AppError) {
    return err;
  }

  // Log the full error for debugging
  const logPrefix = context ? `[${context}]` : '[error]';
  console.error(logPrefix, err);

  // Return safe internal error (don't leak details)
  const message = err instanceof Error ? err.message : 'An unexpected error occurred';
  return new AppError('INTERNAL', message);
}

/**
 * Legacy error response helper for backwards compatibility.
 * Use errorResponse(AppError) for new code.
 * 
 * @deprecated Use errorResponse with AppError instead
 */
export function legacyErrorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}
