import "server-only";

import { createClient } from "@supabase/supabase-js";
import {
  getSupabaseSecretKey,
  getSupabaseUrl,
  isSupabaseConfigured
} from "@/lib/env";

export function getSupabaseAdmin() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase URL yoki secret/service role key sozlanmagan.");
  }

  return createClient(
    getSupabaseUrl()!,
    getSupabaseSecretKey()!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}
