import { isAcceptedPhotoType, MAX_UPLOAD_BYTES } from "@/lib/photos/limits";
import { authorizePhotoAdmin, listPropertyPhotos, reservePropertyPhoto } from "@/lib/photos/repository";
import { json, photoError, readJson, readPropertyId } from "@/app/api/admin/propiedades/[id]/fotos/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const propertyId = readPropertyId((await context.params).id);
  if (!propertyId) {
    return json({ message: "La propiedad no es válida." }, 400);
  }
  const result = await listPropertyPhotos(propertyId);
  if (!result.ok) {
    return photoError(result);
  }
  return json({ photos: result.photos });
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await authorizePhotoAdmin();
  if (!auth.ok) {
    return photoError(auth);
  }
  const propertyId = readPropertyId((await context.params).id);
  if (!propertyId) {
    return json({ message: "La propiedad no es válida." }, 400);
  }
  const body = await readJson(request);
  if (!body || typeof body !== "object") {
    return json({ message: "No se pudo leer la foto." }, 400);
  }
  const record = body as { contentType?: unknown; byteSize?: unknown };
  if (typeof record.contentType !== "string" || !isAcceptedPhotoType(record.contentType)) {
    return json({ message: "Solo se aceptan JPEG, PNG y WebP. HEIC no está soportado." }, 415);
  }
  if (typeof record.byteSize !== "number" || !Number.isInteger(record.byteSize) || record.byteSize <= 0) {
    return json({ message: "El tamaño de la foto no es válido." }, 400);
  }
  if (record.byteSize > MAX_UPLOAD_BYTES) {
    return json({ message: "La foto supera los 15 MB." }, 413);
  }
  const result = await reservePropertyPhoto(propertyId, record.contentType, record.byteSize);
  if (!result.ok) {
    return photoError(result);
  }
  return json({
    photoId: result.photoId,
    uploadUrl: result.uploadUrl,
    contentType: result.contentType,
  });
}
