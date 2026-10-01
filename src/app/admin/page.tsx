import { PropertyTable } from "@/components/admin/PropertyTable";
import { devMeasure } from "@/lib/dev/timing";
import { requireAdmin } from "@/lib/auth/session";
import { PROPERTY_OPERATIONS, PROPERTY_STATUSES, PROPERTY_TYPES, type PropertyOperation, type PropertyStatus, type PropertyType } from "@/lib/properties/model";
import { listProperties } from "@/lib/properties/repository";

export const dynamic = "force-dynamic";

type AdminPageProps = {
  searchParams: Promise<{ q?: string; estado?: string; tipo?: string; operacion?: string; eliminada?: string; aviso?: string }>;
};

export default async function AdminHomePage({ searchParams }: AdminPageProps) {
  return devMeasure("abrir-listado", "total", async () => {
    await devMeasure("abrir-listado", "auth", () => requireAdmin());
    const params = await searchParams;
    const status = PROPERTY_STATUSES.find((item) => item === params.estado) ?? null;
    const propertyType = PROPERTY_TYPES.find((item) => item === params.tipo) ?? null;
    const operation = PROPERTY_OPERATIONS.find((item) => item === params.operacion) ?? null;
    const result = await devMeasure("abrir-listado", "consulta", () =>
      listProperties({
        query: params.q ?? "",
        status,
        propertyType,
        operation,
      }),
    );

    return (
      <PropertyTable
        properties={result.ok ? result.properties : []}
        query={params.q ?? ""}
        status={(status ?? "") as PropertyStatus | ""}
        propertyType={(propertyType ?? "") as PropertyType | ""}
        operation={(operation ?? "") as PropertyOperation | ""}
        removed={params.eliminada === "1"}
        notice={params.aviso ?? null}
        unavailableMessage={result.ok ? null : result.message}
      />
    );
  });
}
