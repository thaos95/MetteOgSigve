/**
 * Admin authentication utilities.
 * Centralizes the password check pattern used by all admin routes.
 */

import { NextResponse } from 'next/server';
import { AppError, errorResponse } from './errors';

/**
 * Verify admin password from request body.
 * Returns the parsed body if authenticated, or throws AppError.
 * 
 * Usage:
 *   const body = await verifyAdminAuth(req);
 *   // body.password is now verified
 */
export async function verifyAdminAuth<T extends { password?: string }>(
  req: Request
): Promise<T & { password: string }> {
  let body: T;
  
  try {
    body = await req.json();
  } catch {
    throw new AppError('VALIDATION_ERROR', 'Invalid JSON body');
  }

  const password = body?.password;
  
  if (!password) {
    throw AppError.unauthorized('Password required');
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    throw AppError.unauthorized('Invalid password');
  }

  return body as T & { password: string };
}

/**
 * Middleware wrapper for admin routes.
 * Handles authentication and error responses automatically.
 * 
 * Usage:
 *   export const POST = withAdminAuth(async (req, body) => {
 *     // body is already authenticated
 *     return NextResponse.json({ ok: true });
 *   });
 */
export function withAdminAuth<T extends { password?: string }, R>(
  handler: (req: Request, body: T & { password: string }) => Promise<NextResponse<R>>
): (req: Request) => Promise<NextResponse<R | { error: string } | { ok: false; error: { code: string; message: string } }>> {
  return async (req: Request) => {
    try {
      const body = await verifyAdminAuth<T>(req);
      return handler(req, body);
    } catch (err) {
      if (err instanceof AppError) {
        return errorResponse(err) as NextResponse<any>;
      }
      console.error('[admin-auth]', err);
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Internal error' },
        { status: 500 }
      ) as NextResponse<any>;
    }
  };
}

/**
 * Get admin metadata from request headers for audit logging.
 */
export function getAdminMetadata(req: Request) {
  return {
    adminEmail: process.env.ADMIN_EMAIL || 'admin',
    ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
        || req.headers.get('x-real-ip') 
        || null,
    deviceId: req.headers.get('x-device-id') || null,
  };
}

/**
 * Type-safe admin password check (for use without middleware).
 */
export function isValidAdminPassword(password: unknown): password is string {
  return (
    typeof password === 'string' &&
    password.length > 0 &&
    password === process.env.ADMIN_PASSWORD
  );
}
