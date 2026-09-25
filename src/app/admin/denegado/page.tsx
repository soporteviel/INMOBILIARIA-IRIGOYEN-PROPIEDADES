import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/admin/actions";
import { adminButtonClass, adminLinkClass, AdminFrame } from "@/components/admin/AdminFrame";
import { getAuthState } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminDeniedPage() {
  const auth = await getAuthState();
  if (auth.status === "unconfigured") {
    redirect("/admin/login?error=config");
  }
  if (auth.status === "anonymous") {
    redirect("/admin/login");
  }
  if (auth.isAdmin) {
    redirect("/admin");
  }

  return (
    <AdminFrame title="Acceso denegado">
      <p className="text-sm leading-relaxed text-tinta">
        {auth.email ? `La cuenta ${auth.email} ` : "Esta cuenta "}
        no está autorizada para administrar el sitio.
      </p>
      <div className="mt-6 flex flex-col gap-3">
        <form action={logoutAction}>
          <button type="submit" className={adminButtonClass}>
            Cerrar sesión
          </button>
        </form>
        <Link href="/" className={`${adminLinkClass} text-center`}>
          Ver sitio
        </Link>
      </div>
    </AdminFrame>
  );
}
