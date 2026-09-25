import { RecoveryForm } from "@/app/admin/recuperar/RecoveryForm";
import { AdminFrame } from "@/components/admin/AdminFrame";
import { getPublicSupabaseEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default function RecoveryPage() {
  const missingConfig = !getPublicSupabaseEnv();

  return (
    <AdminFrame title="Recuperar contraseña">
      {missingConfig ? (
        <p className="mb-4 text-sm leading-relaxed text-verde-oscuro" role="alert">
          Falta la configuración de Supabase. Completá .env.local y reiniciá el servidor.
        </p>
      ) : null}
      <RecoveryForm disabled={missingConfig} />
    </AdminFrame>
  );
}
