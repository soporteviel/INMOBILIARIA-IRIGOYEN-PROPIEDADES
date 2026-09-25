import { redirect } from "next/navigation";
import { LoginForm } from "@/app/admin/login/LoginForm";
import { AdminFrame } from "@/components/admin/AdminFrame";
import { getAuthState } from "@/lib/auth/session";
import { getPublicSupabaseEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const auth = await getAuthState();
  if (auth.status === "authenticated") {
    redirect(auth.isAdmin ? "/admin" : "/admin/denegado");
  }

  const params = await searchParams;
  const missingConfig = !getPublicSupabaseEnv() || params.error === "config";

  return (
    <AdminFrame title="Ingresar">
      {missingConfig ? (
        <p className="mb-4 text-sm leading-relaxed text-verde-oscuro" role="alert">
          Falta la configuración de Supabase. Completá .env.local y reiniciá el servidor.
        </p>
      ) : null}
      <LoginForm disabled={missingConfig} />
    </AdminFrame>
  );
}
