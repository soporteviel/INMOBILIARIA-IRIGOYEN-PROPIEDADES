"use server";

import { redirect } from "next/navigation";
import { getAuthState } from "@/lib/auth/session";
import { getPublicSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type LoginState = {
  formError?: string;
  fieldErrors?: {
    email?: string;
    password?: string;
  };
};

function loginMessage(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login") || normalized.includes("invalid credentials")) {
    return "El email o la contraseña no son correctos.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Tenés que confirmar el email antes de ingresar.";
  }
  return "No se pudo iniciar sesión.";
}

export async function loginAction(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  if (!getPublicSupabaseEnv()) {
    return {
      formError: "Falta la configuración de Supabase. Completá .env.local y reiniciá el servidor.",
    };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fieldErrors: LoginState["fieldErrors"] = {};

  if (!email || !email.includes("@")) {
    fieldErrors.email = "Ingresá un email válido.";
  }
  if (!password) {
    fieldErrors.password = "Ingresá la contraseña.";
  }
  if (fieldErrors.email || fieldErrors.password) {
    return { fieldErrors };
  }

  const supabase = await createClient();
  if (!supabase) {
    return {
      formError: "Falta la configuración de Supabase. Completá .env.local y reiniciá el servidor.",
    };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { formError: loginMessage(error.message) };
  }

  const auth = await getAuthState();
  if (auth.status !== "authenticated") {
    await supabase.auth.signOut();
    return { formError: "No se pudo verificar la sesión." };
  }
  if (!auth.isAdmin) {
    redirect("/admin/denegado");
  }

  redirect("/admin");
}
