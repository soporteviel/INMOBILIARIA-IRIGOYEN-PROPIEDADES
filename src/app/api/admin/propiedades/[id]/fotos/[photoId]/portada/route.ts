import { setPropertyCover } from "@/lib/photos/repository";
import { json, photoError, readPropertyId } from "@/app/api/admin/propiedades/[id]/fotos/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string; photoId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { id, photoId } = await context.params;
  const propertyId = readPropertyId(id);
  const photo = readPropertyId(photoId);
  if (!propertyId || !photo) {
    return json({ message: "La foto no es válida." }, 400);
  }
  const result = await setPropertyCover(propertyId, photo);
  if (!result.ok) {
    return photoError(result);
  }
  return json({ ok: true });
}
