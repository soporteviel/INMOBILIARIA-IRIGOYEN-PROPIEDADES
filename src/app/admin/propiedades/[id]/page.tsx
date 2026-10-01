import { PropertyForm } from "@/components/admin/PropertyForm";
import { devMeasure } from "@/lib/dev/timing";
import { requireAdmin } from "@/lib/auth/session";
import { propertyToForm } from "@/lib/properties/model";
import { getProperty } from "@/lib/properties/repository";
import { IconArrowLeft } from "@/components/admin/icons";
import Link from "next/link";

export const dynamic = "force-dynamic";

type EditPropertyPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPropertyPage({ params }: EditPropertyPageProps) {
  return devMeasure("abrir-editar", "total", async () => {
    await devMeasure("abrir-editar", "auth", () => requireAdmin());
    const { id } = await params;
    const result = await devMeasure("abrir-editar", "consulta", () => getProperty(id));

    if (!result.ok) {
      return (
        <div className="rounded-[10px] border border-[#e4e0d8] bg-white p-6">
          <p className="text-[15px] text-[#2a2a2a]" role="alert">
            {result.message}
          </p>
          <div className="mt-4 flex flex-wrap gap-4">
            <Link
              href="/admin"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#e4e0d8] bg-white px-3 text-sm text-[#2a2a2a] transition-colors hover:border-[#155547] hover:text-[#155547] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155547]"
            >
              <IconArrowLeft />
              Volver a propiedades
            </Link>
            <Link href={`/admin/propiedades/${id}`} className="text-[15px] text-[#155547]">
              Reintentar
            </Link>
          </div>
        </div>
      );
    }

    return (
      <PropertyForm
        key={result.property.updatedAt}
        property={result.property}
        initialValues={propertyToForm(result.property)}
      />
    );
  });
}
