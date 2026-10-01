import { PropertyForm } from "@/components/admin/PropertyForm";
import { devMeasure } from "@/lib/dev/timing";
import { requireAdmin } from "@/lib/auth/session";
import { emptyPropertyForm } from "@/lib/properties/model";

export const dynamic = "force-dynamic";

export default async function NewPropertyPage() {
  return devMeasure("abrir-nueva", "total", async () => {
    await devMeasure("abrir-nueva", "auth", () => requireAdmin());
    return <PropertyForm property={null} initialValues={emptyPropertyForm()} />;
  });
}
