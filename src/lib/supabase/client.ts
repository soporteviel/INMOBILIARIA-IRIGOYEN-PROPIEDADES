import { createBrowserClient } from "@supabase/ssr";
import { getPublicSupabaseEnv } from "@/lib/supabase/env";

export function createClient() {
  const env = getPublicSupabaseEnv();
  if (!env) {
    throw new Error("Falta la configuración pública de Supabase.");
  }

  return createBrowserClient(env.url, env.key);
}
