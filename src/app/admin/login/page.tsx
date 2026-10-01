import { redirect } from "next/navigation";
import { LoginForm } from "@/app/admin/login/LoginForm";
import { AdminFrame } from "@/components/admin/AdminFrame";
import { adminEntryPath, getAuthState } from "@/lib/auth/session";
import { getPublicSupabaseEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; aviso?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const auth = await getAuthState();
  if (auth.status === "authenticated") {
    redirect(adminEntryPath(auth));
  }

  const params = await searchParams;
  const missingConfig = !getPublicSupabaseEnv() || params.error === "config";
  const passwordSaved = params.aviso === "clave";

  return (
    <AdminFrame title="Ingresar">
      {passwordSaved ? (
        <p className="mb-4 text-sm leading-relaxed text-tinta">
          La contraseña quedó guardada. Entrá de nuevo con esa clave.
        </p>
      ) : null}
      {missingConfig ? (
        <p className="mb-4 text-sm leading-relaxed text-verde-oscuro" role="alert">
          Falta la configuración de Supabase. Completá .env.local y reiniciá el servidor.
        </p>
      ) : null}
      <LoginForm disabled={missingConfig} />
    </AdminFrame>
  );
}
