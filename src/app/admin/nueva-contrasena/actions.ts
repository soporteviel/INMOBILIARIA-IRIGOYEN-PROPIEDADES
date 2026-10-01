"use server";

import { redirect } from "next/navigation";
import { getAuthState } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type PasswordState = {
  formError?: string;
  fieldErrors?: {
    password?: string;
    confirm?: string;
  };
};

export async function updatePasswordAction(
  _previous: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const auth = await getAuthState();
  if (auth.status === "unconfigured") {
    redirect("/admin/login?error=config");
  }
  if (auth.status === "anonymous") {
    redirect("/admin/login");
  }

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const fieldErrors: PasswordState["fieldErrors"] = {};

  if (password.length < 8) {
    fieldErrors.password = "La contraseña tiene que tener al menos 8 caracteres.";
  }
  if (password !== confirm) {
    fieldErrors.confirm = "Las contraseñas no coinciden.";
  }
  if (fieldErrors.password || fieldErrors.confirm) {
    return { fieldErrors };
  }

  const supabase = await createClient();
  if (!supabase) {
    redirect("/admin/login?error=config");
  }

  if (!auth.userId) {
    return { formError: "No se pudo identificar la cuenta." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { formError: "No se pudo guardar la contraseña." };
  }

  try {
    const admin = createAdminClient();
    const { error: metaError } = await admin.auth.admin.updateUserById(auth.userId, {
      app_metadata: { role: "admin", password_change_required: false },
    });
    if (metaError) {
      return { formError: "La contraseña se guardó, pero hay que volver a intentarlo." };
    }
  } catch {
    return { formError: "La contraseña se guardó, pero hay que volver a intentarlo." };
  }

  const { error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError) {
    await supabase.auth.signOut();
    redirect("/admin/login?aviso=clave");
  }

  redirect("/admin");
}
