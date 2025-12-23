import { createClient } from "@supabase/supabase-js";

// Use the non-public SUPABASE_URL for server-side clients (keeps intent clear)
const supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) as string;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  // Throw early so runtime errors are clear during local dev
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for server-side Supabase client.");
}

export const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});
