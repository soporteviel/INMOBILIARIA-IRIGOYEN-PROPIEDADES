import { redirect } from "next/navigation";
import { PasswordForm } from "@/app/admin/nueva-contrasena/PasswordForm";
import { AdminFrame } from "@/components/admin/AdminFrame";
import { getAuthState } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function NewPasswordPage() {
  const auth = await getAuthState();
  if (auth.status === "unconfigured") {
    redirect("/admin/login?error=config");
  }
  if (auth.status === "anonymous") {
    redirect("/admin/login");
  }

  return (
    <AdminFrame title="Nueva contraseña">
      <PasswordForm />
    </AdminFrame>
  );
}
