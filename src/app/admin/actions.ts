"use server";

import { redirect } from "next/navigation";
import { getAuthState } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function logoutAction() {
  const auth = await getAuthState();
  if (auth.status !== "authenticated") {
    redirect("/admin/login");
  }

  const supabase = await createClient();
  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect("/admin/login");
}
