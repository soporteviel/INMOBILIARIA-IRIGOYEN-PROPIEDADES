import { AdminShell } from "@/components/admin/AdminShell";
import { PropertyForm } from "@/components/admin/PropertyForm";
import { requireAdmin } from "@/lib/auth/session";
import { propertyToForm } from "@/lib/properties/model";
import { getProperty } from "@/lib/properties/repository";
import Link from "next/link";

export const dynamic = "force-dynamic";

type EditPropertyPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ guardado?: string }>;
};

export default async function EditPropertyPage({ params, searchParams }: EditPropertyPageProps) {
  const admin = await requireAdmin();
  const { id } = await params;
  const query = await searchParams;
  const result = await getProperty(id);

  return (
    <AdminShell email={admin.email || "Administrador"}>
      {result.ok ? (
        <PropertyForm
          key={result.property.updatedAt}
          property={result.property}
          initialValues={propertyToForm(result.property)}
          saved={query.guardado === "1"}
        />
      ) : (
        <div className="rounded-[10px] border border-[#e4e0d8] bg-white p-6">
          <p className="text-[15px] text-[#2a2a2a]" role="alert">
            {result.message}
          </p>
          <div className="mt-4 flex flex-wrap gap-4">
            <Link href="/admin" className="text-[15px] text-[#155547]">
              Volver a propiedades
            </Link>
            <Link href={`/admin/propiedades/${id}`} className="text-[15px] text-[#155547]">
              Reintentar
            </Link>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
