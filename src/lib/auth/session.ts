import "server-only";
import { cache } from "react";
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
 *
 * password_change_required obliga a elegir otra contraseña al entrar.
 * Se pone en true al crear la cuenta y el servidor lo pasa a false
 * recién después de guardar la clave nueva.
 */
export type AuthState =
  | { status: "unconfigured" }
  | { status: "anonymous" }
  | {
      status: "authenticated";
      userId: string;
      email: string;
      isAdmin: boolean;
      mustChangePassword: boolean;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function appMetadata(claims: Record<string, unknown>) {
  return isRecord(claims.app_metadata) ? claims.app_metadata : null;
}

function hasAdminRole(claims: Record<string, unknown>) {
  return appMetadata(claims)?.role === "admin";
}

function mustChangePassword(claims: Record<string, unknown>) {
  return hasAdminRole(claims) && appMetadata(claims)?.password_change_required === true;
}

export const getAuthState = cache(async function getAuthState(): Promise<AuthState> {
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
  const userId = typeof claims.sub === "string" ? claims.sub : "";

  return {
    status: "authenticated",
    userId,
    email,
    isAdmin: hasAdminRole(claims),
    mustChangePassword: mustChangePassword(claims),
  };
});

export function adminEntryPath(auth: Extract<AuthState, { status: "authenticated" }>) {
  if (!auth.isAdmin) {
    return "/admin/denegado";
  }
  if (auth.mustChangePassword) {
    return "/admin/nueva-contrasena";
  }
  return "/admin";
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
  if (auth.mustChangePassword) {
    redirect("/admin/nueva-contrasena");
  }
  return auth;
}
