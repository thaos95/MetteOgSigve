import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";
import { adminAuthSchema } from "../../../../domain/rsvp/schema";
import { AppError, errorResponse, zodToAppError, handleUnknownError } from "../../../../lib/errors";
import type { ZodError } from 'zod';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate admin auth
    const authResult = adminAuthSchema.safeParse(body);
    if (!authResult.success) {
      return errorResponse(zodToAppError(authResult.error as ZodError));
    }
    
    if (authResult.data.password !== process.env.ADMIN_PASSWORD) {
      return errorResponse(AppError.unauthorized());
    }

    const { data, error } = await supabaseServer.from("rsvps").select("*").order("created_at", { ascending: false });
    if (error) return errorResponse(new AppError('INTERNAL', error.message));
    return NextResponse.json({ rsvps: data });
  } catch (err: unknown) {
    return errorResponse(handleUnknownError(err, 'admin-rsvps'));
  }
}

// NOTE: This is more secure than accepting a password via query string since it
// avoids storing secrets in server logs or browser history. For production use,
// consider proper auth (Supabase Auth / Magic Link / OAuth) or platform-level protection.