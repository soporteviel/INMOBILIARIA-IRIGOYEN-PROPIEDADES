import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseEnv } from "@/lib/supabase/env";

/**
 * Cliente privilegiado. La clave secreta evita RLS y no debe usarse para
 * login, lectura de la sesión ni ninguna operación del usuario autenticado.
 * Reservado para tareas de servidor que todavía no están implementadas.
 */
export function createAdminClient() {
  const env = getPublicSupabaseEnv();
  const secret = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!env || !secret) {
    throw new Error("Falta la configuración privada de Supabase.");
  }

  return createClient(env.url, secret, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
