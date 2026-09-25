import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPublicSupabaseEnv } from "@/lib/supabase/env";

/**
 * Autorización solo con app_metadata.role === "admin".
 * user_metadata lo puede editar la persona y no se usa.
 *
 * El rol entra al JWT cuando la sesión se crea o se renueva. getClaims()
 * verifica la firma de ese token; no consulta el usuario en vivo.
 * Asignar o revocar el rol en el dashboard no cambia el token actual.
 * Para que el cambio valga, hay que cerrar sesión y volver a entrar.
 * Para cortar un acceso ya emitido, además de quitar el rol hay que revocar
 * las sesiones de esa cuenta en Supabase.
 */
export type AuthState =
  | { status: "unconfigured" }
  | { status: "anonymous" }
  | { status: "authenticated"; email: string; isAdmin: boolean };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasAdminRole(claims: Record<string, unknown>) {
  if (!isRecord(claims.app_metadata)) {
    return false;
  }
  return claims.app_metadata.role === "admin";
}

export async function getAuthState(): Promise<AuthState> {
  if (!getPublicSupabaseEnv()) {
    return { status: "unconfigured" };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { status: "unconfigured" };
  }

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    return { status: "anonymous" };
  }

  const claims = data.claims as Record<string, unknown>;
  const email = typeof claims.email === "string" ? claims.email : "";

  return {
    status: "authenticated",
    email,
    isAdmin: hasAdminRole(claims),
  };
}

export async function requireAdmin() {
  const auth = await getAuthState();
  if (auth.status === "unconfigured") {
    redirect("/admin/login?error=config");
  }
  if (auth.status === "anonymous") {
    redirect("/admin/login");
  }
  if (!auth.isAdmin) {
    redirect("/admin/denegado");
  }
  return auth;
}
