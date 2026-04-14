import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let cachedClient: SupabaseClient | null | undefined;

export function getSupabaseServerClient(): SupabaseClient | null {
  if (cachedClient !== undefined) {
    return cachedClient;
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    cachedClient = null;
    return cachedClient;
  }

  cachedClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedClient;
}

export function isSupabaseServerConfigured(): boolean {
  return getSupabaseServerClient() !== null;
}
