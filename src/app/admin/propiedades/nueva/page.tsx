import { AdminShell } from "@/components/admin/AdminShell";
import { PropertyForm } from "@/components/admin/PropertyForm";
import { requireAdmin } from "@/lib/auth/session";
import { emptyPropertyForm } from "@/lib/properties/model";

export const dynamic = "force-dynamic";

export default async function NewPropertyPage() {
  const admin = await requireAdmin();

  return (
    <AdminShell email={admin.email || "Administrador"}>
      <PropertyForm property={null} initialValues={emptyPropertyForm()} saved={false} />
    </AdminShell>
  );
}
