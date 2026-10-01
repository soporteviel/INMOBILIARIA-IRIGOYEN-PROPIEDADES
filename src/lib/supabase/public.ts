import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseEnv } from "@/lib/supabase/env";

/**
 * Cliente anónimo, sin cookies ni sesión.
 * Aunque el visitante sea admin, esta lectura queda sujeta a las políticas públicas.
 */
export function createPublicClient() {
  const env = getPublicSupabaseEnv();
  if (!env) {
    return null;
  }

  return createClient(env.url, env.key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
