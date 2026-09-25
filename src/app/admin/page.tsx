import { AdminShell } from "@/components/admin/AdminShell";
import { PropertyTable } from "@/components/admin/PropertyTable";
import { requireAdmin } from "@/lib/auth/session";
import { PROPERTY_STATUSES, type PropertyStatus } from "@/lib/properties/model";
import { listProperties } from "@/lib/properties/repository";

export const dynamic = "force-dynamic";

type AdminPageProps = {
  searchParams: Promise<{ q?: string; estado?: string; eliminada?: string }>;
};

export default async function AdminHomePage({ searchParams }: AdminPageProps) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const status = PROPERTY_STATUSES.find((item) => item === params.estado) ?? null;
  const result = await listProperties({
    query: params.q ?? "",
    status,
  });

  return (
    <AdminShell email={admin.email || "Administrador"}>
      <PropertyTable
        properties={result.ok ? result.properties : []}
        query={params.q ?? ""}
        status={(status ?? "") as PropertyStatus | ""}
        removed={params.eliminada === "1"}
        unavailableMessage={result.ok ? null : result.message}
      />
    </AdminShell>
  );
}
