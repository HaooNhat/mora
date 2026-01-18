import { createClient } from "@supabase/supabase-js";
import type { Database } from "@workspace/infrastructure/supabase/database.types";

/**
 * Environment variables validation
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check your .env.local file.",
  );
}

/**
 * Supabase client instance
 * Used for client-side operations
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      "x-application-name": "mora",
    },
  },
});

// /**
//  * Helper to get current user ID
//  */
// export async function getCurrentUserId(): Promise<string | null> {
//   const {
//     data: { user },
//   } = await supabase.auth.getUser();
//   return user?.id ?? null;
// }
//
// /**
//  * Helper to check authentication status
//  */
// export async function isAuthenticated(): Promise<boolean> {
//   const userId = await getCurrentUserId();
//   return userId !== null;
// }
