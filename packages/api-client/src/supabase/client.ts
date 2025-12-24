import { createClient } from "@supabase/supabase-js";

const SupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SupabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Create a single supabase client for interacting with your database
export const supabase = createClient(SupabaseUrl, SupabaseKey);
