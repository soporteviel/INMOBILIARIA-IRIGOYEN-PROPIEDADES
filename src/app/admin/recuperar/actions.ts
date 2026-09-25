"use server";

import { getSiteUrl, getPublicSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type RecoveryState = {
  formError?: string;
  fieldErrors?: { email?: string };
  message?: string;
};

export async function recoveryAction(
  _previous: RecoveryState,
  formData: FormData,
): Promise<RecoveryState> {
  if (!getPublicSupabaseEnv()) {
    return {
      formError: "Falta la configuración de Supabase. Completá .env.local y reiniciá el servidor.",
    };
  }

  const email = String(formData.get("email") ?? "").trim();
  if (!email || !email.includes("@")) {
    return { fieldErrors: { email: "Ingresá un email válido." } };
  }

  const supabase = await createClient();
  if (!supabase) {
    return {
      formError: "Falta la configuración de Supabase. Completá .env.local y reiniciá el servidor.",
    };
  }

  const redirectTo = `${getSiteUrl()}/admin/auth/callback?next=/admin/nueva-contrasena`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) {
    return { formError: "No se pudo iniciar la recuperación." };
  }

  return {
    message:
      "Si la cuenta existe, quedó pendiente el enlace para elegir una contraseña. El correo no llega a casillas externas hasta configurar el envío.",
  };
}
