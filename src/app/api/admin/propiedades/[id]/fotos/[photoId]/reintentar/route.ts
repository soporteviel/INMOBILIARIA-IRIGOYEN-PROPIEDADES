import { isAcceptedPhotoType, MAX_UPLOAD_BYTES } from "@/lib/photos/limits";
import { authorizePhotoAdmin, retryPropertyPhotoUpload } from "@/lib/photos/repository";
import { json, photoError, readJson, readPropertyId } from "@/app/api/admin/propiedades/[id]/fotos/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string; photoId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const auth = await authorizePhotoAdmin();
  if (!auth.ok) {
    return photoError(auth);
  }
  const { id, photoId } = await context.params;
  const propertyId = readPropertyId(id);
  const photo = readPropertyId(photoId);
  if (!propertyId || !photo) {
    return json({ message: "La foto no es válida." }, 400);
  }
  const body = await readJson(request);
  if (!body || typeof body !== "object") {
    return json({ message: "No se pudo leer la foto." }, 400);
  }
  const record = body as { contentType?: unknown; byteSize?: unknown };
  if (typeof record.contentType !== "string" || !isAcceptedPhotoType(record.contentType)) {
    return json({ message: "Solo se aceptan JPEG, PNG y WebP. HEIC no está soportado." }, 415);
  }
  if (typeof record.byteSize !== "number" || !Number.isInteger(record.byteSize) || record.byteSize <= 0 || record.byteSize > MAX_UPLOAD_BYTES) {
    return json({ message: "El tamaño de la foto no es válido." }, 400);
  }
  const result = await retryPropertyPhotoUpload(propertyId, photo, record.contentType, record.byteSize);
  if (!result.ok) {
    return photoError(result);
  }
  return json({
    photoId: result.photoId,
    uploadUrl: result.uploadUrl,
    contentType: result.contentType,
  });
}
