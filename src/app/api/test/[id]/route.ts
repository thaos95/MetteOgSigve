import { AppError, errorResponse } from '../../../../lib/errors';

/**
 * Test route - DISABLED in all environments.
 * 
 * Previously used for dynamic parameter validation during development.
 * Left as a stub to prevent 404 confusion.
 */
export async function GET() {
  return errorResponse(AppError.notFound('Test route is disabled'));
}
