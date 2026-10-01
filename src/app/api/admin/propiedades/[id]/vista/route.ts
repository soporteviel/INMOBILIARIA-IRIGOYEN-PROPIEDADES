import { json, readPropertyId } from "@/app/api/admin/propiedades/[id]/fotos/http";
import { authorizePhotoAdmin } from "@/lib/photos/repository";
import { getProperty } from "@/lib/properties/repository";
import { revalidatePublicViews } from "@/lib/properties/revalidate-public";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const auth = await authorizePhotoAdmin();
  if (!auth.ok) {
    return json({ message: auth.message }, auth.status);
  }
  const propertyId = readPropertyId((await context.params).id);
  if (!propertyId) {
    return json({ message: "La propiedad no es válida." }, 400);
  }
  const existing = await getProperty(propertyId);
  if (!existing.ok) {
    return json({ message: existing.message }, existing.code === "not_found" ? 404 : 500);
  }
  if (existing.property.status !== "PUBLICADA") {
    return json({ ok: true, skipped: true });
  }
  await revalidatePublicViews({ slug: existing.property.slug });
  return json({ ok: true });
}
