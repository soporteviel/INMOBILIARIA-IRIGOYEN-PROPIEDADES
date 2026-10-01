import { reorderPropertyPhotos } from "@/lib/photos/repository";
import { json, photoError, readJson, readPropertyId } from "@/app/api/admin/propiedades/[id]/fotos/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const propertyId = readPropertyId((await context.params).id);
  if (!propertyId) {
    return json({ message: "La propiedad no es válida." }, 400);
  }
  const body = await readJson(request);
  const ids = body && typeof body === "object" ? (body as { ids?: unknown }).ids : null;
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string" || !UUID_RE.test(id))) {
    return json({ message: "El orden de las fotos no es válido." }, 400);
  }
  const result = await reorderPropertyPhotos(propertyId, ids);
  if (!result.ok) {
    return photoError(result);
  }
  return json({ ok: true });
}
