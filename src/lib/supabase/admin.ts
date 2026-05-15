import "server-only";

import { createClient } from "@supabase/supabase-js";
import {
  getSupabaseSecretKey,
  getSupabaseUrl,
  isSupabaseConfigured
} from "@/lib/env";

export function getSupabaseAdmin() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase URL yoki secret key sozlanmagan. NEXT_PUBLIC_SUPABASE_URL va SUPABASE_SECRET_KEY/SUPABASE_SERVICE_ROLE_KEY kerak."
    );
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
