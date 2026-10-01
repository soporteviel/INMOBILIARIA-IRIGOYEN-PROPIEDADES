import { devTiming } from "@/lib/dev/timing";
import { completePropertyPhoto } from "@/lib/photos/repository";
import { json, photoError, readPropertyId } from "@/app/api/admin/propiedades/[id]/fotos/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

type RouteContext = { params: Promise<{ id: string; photoId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id, photoId } = await context.params;
  const propertyId = readPropertyId(id);
  const photo = readPropertyId(photoId);
  if (!propertyId || !photo) {
    return json({ message: "La foto no es válida." }, 400);
  }
  const body = (await request.json().catch(() => null)) as { width?: unknown; height?: unknown; byteSize?: unknown } | null;
  const prepared =
    body && typeof body.width === "number" && typeof body.height === "number" && typeof body.byteSize === "number"
      ? { width: body.width, height: body.height, byteSize: body.byteSize }
      : undefined;
  const started = performance.now();
  const result = await completePropertyPhoto(propertyId, photo, prepared);
  devTiming("foto-completar", "total", started, photo);
  if (!result.ok) {
    return photoError(result);
  }
  return json({ ok: true });
}
