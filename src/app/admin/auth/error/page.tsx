import Link from "next/link";
import { adminLinkClass, AdminFrame } from "@/components/admin/AdminFrame";

export const dynamic = "force-dynamic";

export default function AuthErrorPage() {
  return (
    <AdminFrame title="Enlace no válido">
      <p className="text-sm leading-relaxed text-tinta">
        El enlace venció o no corresponde a una invitación o a una recuperación de contraseña.
      </p>
      <Link href="/admin/login" className={`${adminLinkClass} mt-6 inline-flex`}>
        Volver al ingreso
      </Link>
    </AdminFrame>
  );
}
