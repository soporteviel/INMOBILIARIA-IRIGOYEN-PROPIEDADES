import "server-only";

import { devTiming } from "@/lib/dev/timing";
import { getAuthState } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PENDING_PHOTO_TTL_MS } from "@/lib/photos/limits";
import { processPhoto } from "@/lib/photos/process";
import {
  deleteObject,
  finalObjectKey,
  readObject,
  r2ConfigError,
  signPhotoUpload,
  signPhotoView,
  sourceObjectKey,
  writeObject,
} from "@/lib/r2/client";
import type { AcceptedPhotoType } from "@/lib/photos/limits";

const PHOTO_COLUMNS =
  "id, property_id, object_key, position, width, height, byte_size, status, is_cover, created_at, updated_at";

export type PhotoStatus = "pending" | "ready" | "deleting";

export type PropertyPhotoRow = {
  id: string;
  property_id: string;
  object_key: string;
  position: number;
  width: number | null;
  height: number | null;
  byte_size: number | null;
  status: PhotoStatus;
  is_cover: boolean;
  created_at: string;
  updated_at: string;
};

export type PhotoError = { ok: false; message: string; status: number };

type Db = NonNullable<Awaited<ReturnType<typeof createClient>>>;

export async function authorizePhotoAdmin(): Promise<{ ok: true } | PhotoError> {
  const auth = await getAuthState();
  if (auth.status === "unconfigured") {
    return { ok: false, message: "Falta la configuración de Supabase.", status: 503 };
  }
  if (auth.status !== "authenticated") {
    return { ok: false, message: "Tenés que iniciar sesión.", status: 401 };
  }
  if (!auth.isAdmin || auth.mustChangePassword) {
    return { ok: false, message: "No tenés permiso para administrar fotos.", status: 403 };
  }
  return { ok: true };
}

async function adminDb(): Promise<{ ok: true; supabase: Db } | PhotoError> {
  const auth = await authorizePhotoAdmin();
  if (!auth.ok) {
    return auth;
  }
  const configError = r2ConfigError();
  if (configError) {
    return { ok: false, message: configError, status: 503 };
  }
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "Falta la configuración de Supabase.", status: 503 };
  }
  return { ok: true, supabase };
}

function mapDbError(error: { code?: string; message?: string } | null, fallback: string): PhotoError {
  if (!error) {
    return { ok: false, message: fallback, status: 500 };
  }
  if (error.code === "P0001" || /photo_limit/i.test(error.message ?? "")) {
    return { ok: false, message: "Esta propiedad ya tiene 20 fotos.", status: 409 };
  }
  if (error.code === "P0002" || error.code === "PGRST116") {
    return { ok: false, message: "No encontramos esa propiedad.", status: 404 };
  }
  if (error.code === "42501" || /row-level security|forbidden/i.test(error.message ?? "")) {
    return { ok: false, message: "No tenés permiso para modificar fotos.", status: 403 };
  }
  if (error.code === "PGRST205" || error.code === "42P01" || /could not find the table|schema cache/i.test(error.message ?? "")) {
    return {
      ok: false,
      message: "Falta ejecutar la migración de fotos en el proyecto beymsocusbarjwolyrlz.",
      status: 503,
    };
  }
  if (error.code === "23505") {
    return { ok: false, message: "Esa foto ya está registrada.", status: 409 };
  }
  return { ok: false, message: fallback, status: 500 };
}

function isMissingObject(error: unknown) {
  const name = error instanceof Error ? error.name : "";
  return name === "NotFound" || name === "NoSuchKey";
}

async function removeStoredObjects(propertyId: string, photoId: string, objectKey: string) {
  const keys = new Set([objectKey, sourceObjectKey(propertyId, photoId), finalObjectKey(propertyId, photoId)]);
  for (const key of keys) {
    await deleteObject(key);
  }
}

export async function listPropertyPhotos(propertyId: string) {
  const db = await adminDb();
  if (!db.ok) {
    return db;
  }
  await sweepAbandonedPhotos(db.supabase, propertyId);
  await retryDeletingPhotos(db.supabase, propertyId);
  const { data, error } = await db.supabase
    .from("property_photos")
    .select(PHOTO_COLUMNS)
    .eq("property_id", propertyId)
    .in("status", ["pending", "ready"])
    .order("position", { ascending: true });
  if (error) {
    return mapDbError(error, "No se pudieron cargar las fotos.");
  }
  const photos = (data ?? []) as PropertyPhotoRow[];
  const visible = await Promise.all(
    photos.map(async (photo) => ({
      id: photo.id,
      position: photo.position,
      status: photo.status,
      isCover: photo.is_cover,
      width: photo.width,
      height: photo.height,
      byteSize: photo.byte_size,
      previewUrl: photo.status === "ready" ? await signPhotoView(photo.object_key) : null,
    })),
  );
  return { ok: true as const, photos: visible };
}

async function finishPhotoDeletion(supabase: Db, propertyId: string, photoId: string, objectKey: string) {
  try {
    await removeStoredObjects(propertyId, photoId, objectKey);
  } catch {
    return false;
  }
  const { error } = await supabase
    .from("property_photos")
    .delete()
    .eq("id", photoId)
    .eq("property_id", propertyId)
    .eq("status", "deleting");
  return !error;
}

async function markPhotoDeleting(supabase: Db, propertyId: string, photoId: string) {
  const { data, error } = await supabase
    .from("property_photos")
    .update({ status: "deleting", is_cover: false })
    .eq("id", photoId)
    .eq("property_id", propertyId)
    .in("status", ["pending", "ready"])
    .select("id");
  return !error && (data?.length ?? 0) > 0;
}

async function sweepAbandonedPhotos(supabase: Db, propertyId: string) {
  const cutoff = new Date(Date.now() - PENDING_PHOTO_TTL_MS).toISOString();
  const { data, error } = await supabase
    .from("property_photos")
    .select("id, object_key")
    .eq("property_id", propertyId)
    .eq("status", "pending")
    .lt("created_at", cutoff);
  if (error || !data?.length) {
    return;
  }
  for (const row of data as { id: string; object_key: string }[]) {
    const hidden = await markPhotoDeleting(supabase, propertyId, row.id);
    if (!hidden) {
      continue;
    }
    await finishPhotoDeletion(supabase, propertyId, row.id, row.object_key);
  }
}

async function retryDeletingPhotos(supabase: Db, propertyId: string) {
  const { data, error } = await supabase
    .from("property_photos")
    .select("id, object_key")
    .eq("property_id", propertyId)
    .eq("status", "deleting");
  if (error || !data?.length) {
    return;
  }
  for (const row of data as { id: string; object_key: string }[]) {
    await finishPhotoDeletion(supabase, propertyId, row.id, row.object_key);
  }
}

async function getPhoto(supabase: Db, propertyId: string, photoId: string) {
  const { data, error } = await supabase
    .from("property_photos")
    .select(PHOTO_COLUMNS)
    .eq("id", photoId)
    .eq("property_id", propertyId)
    .maybeSingle();
  if (error) {
    return mapDbError(error, "No se pudo abrir la foto.");
  }
  if (!data) {
    return { ok: false as const, message: "No encontramos esa foto.", status: 404 };
  }
  return { ok: true as const, photo: data as PropertyPhotoRow };
}

export async function reservePropertyPhoto(propertyId: string, contentType: AcceptedPhotoType, byteSize: number) {
  const db = await adminDb();
  if (!db.ok) {
    return db;
  }
  const photoId = crypto.randomUUID();
  const objectKey = sourceObjectKey(propertyId, photoId);
  const { error } = await db.supabase.rpc("reserve_property_photo", {
    p_id: photoId,
    p_property_id: propertyId,
    p_object_key: objectKey,
  });
  if (error) {
    return mapDbError(error, "No se pudo reservar la foto.");
  }
  try {
    const uploadUrl = await signPhotoUpload(objectKey, contentType, byteSize);
    return { ok: true as const, photoId, uploadUrl, contentType };
  } catch (error) {
    await db.supabase.from("property_photos").delete().eq("id", photoId);
    const message = error instanceof Error ? error.message : "No se pudo preparar la subida.";
    return { ok: false as const, message, status: 503 };
  }
}

export async function retryPropertyPhotoUpload(propertyId: string, photoId: string, contentType: AcceptedPhotoType, byteSize: number) {
  const db = await adminDb();
  if (!db.ok) {
    return db;
  }
  const existing = await getPhoto(db.supabase, propertyId, photoId);
  if (!existing.ok) {
    return existing;
  }
  if (existing.photo.status !== "pending") {
    return { ok: false as const, message: "Esa foto ya está lista.", status: 409 };
  }
  const objectKey = sourceObjectKey(propertyId, photoId);
  if (existing.photo.object_key !== objectKey && existing.photo.object_key !== finalObjectKey(propertyId, photoId)) {
    return { ok: false as const, message: "La foto no tiene una clave válida.", status: 409 };
  }
  try {
    const uploadUrl = await signPhotoUpload(objectKey, contentType, byteSize);
    return { ok: true as const, photoId, uploadUrl, contentType };
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo preparar la subida.";
    return { ok: false as const, message, status: 503 };
  }
}

async function markPhotoReady(
  supabase: Db,
  propertyId: string,
  photoId: string,
  objectKey: string,
  meta: { width: number; height: number; byteSize: number },
) {
  const { count, error: coverError } = await supabase
    .from("property_photos")
    .select("id", { count: "exact", head: true })
    .eq("property_id", propertyId)
    .eq("is_cover", true);
  if (coverError) {
    return mapDbError(coverError, "No se pudo actualizar la foto.");
  }

  const patch = {
    object_key: objectKey,
    width: meta.width,
    height: meta.height,
    byte_size: meta.byteSize,
    status: "ready" as const,
    is_cover: (count ?? 0) === 0,
  };
  const { error } = await supabase
    .from("property_photos")
    .update(patch)
    .eq("id", photoId)
    .eq("property_id", propertyId)
    .eq("status", "pending");
  if (error?.code === "23505") {
    const retry = await supabase
      .from("property_photos")
      .update({ ...patch, is_cover: false })
      .eq("id", photoId)
      .eq("status", "pending");
    if (retry.error) {
      return mapDbError(retry.error, "No se pudo confirmar la foto.");
    }
    return { ok: true as const };
  }
  if (error) {
    return mapDbError(error, "No se pudo confirmar la foto.");
  }
  return { ok: true as const };
}

export async function completePropertyPhoto(
  propertyId: string,
  photoId: string,
  prepared?: { width: number; height: number; byteSize: number },
) {
  const db = await adminDb();
  if (!db.ok) {
    return db;
  }
  const existing = await getPhoto(db.supabase, propertyId, photoId);
  if (!existing.ok) {
    return existing;
  }
  if (existing.photo.status === "ready") {
    return { ok: true as const };
  }

  if (
    prepared &&
    prepared.width > 0 &&
    prepared.height > 0 &&
    prepared.width <= 8000 &&
    prepared.height <= 8000 &&
    prepared.byteSize > 0 &&
    prepared.byteSize <= 15 * 1024 * 1024
  ) {
    return markPhotoReady(db.supabase, propertyId, photoId, existing.photo.object_key, prepared);
  }

  const sourceKey = sourceObjectKey(propertyId, photoId);
  let stored: { bytes: Buffer };
  const readStarted = performance.now();
  try {
    stored = await readObject(sourceKey);
  } catch (error) {
    if (isMissingObject(error)) {
      return { ok: false as const, message: "La foto todavía no llegó al almacenamiento.", status: 409 };
    }
    return { ok: false as const, message: "No se pudo leer la foto subida.", status: 502 };
  }
  devTiming("foto-completar", "lectura", readStarted, photoId);

  let processed;
  const processStarted = performance.now();
  try {
    processed = await processPhoto(stored.bytes);
  } catch (error) {
    const message = error instanceof Error ? error.message : "La foto no es válida.";
    try {
      await deleteObject(sourceKey);
    } catch {
      // La fila sigue pendiente para poder reintentar.
    }
    return { ok: false as const, message, status: 422 };
  }
  devTiming("foto-completar", "procesamiento", processStarted, photoId);

  const finalKey = finalObjectKey(propertyId, photoId);
  const writeStarted = performance.now();
  try {
    await writeObject(finalKey, processed.bytes, "image/webp");
  } catch {
    return { ok: false as const, message: "No se pudo guardar la foto optimizada.", status: 502 };
  }
  devTiming("foto-completar", "escritura", writeStarted, photoId);

  const marked = await markPhotoReady(db.supabase, propertyId, photoId, finalKey, {
    width: processed.width,
    height: processed.height,
    byteSize: processed.byteSize,
  });
  if (!marked.ok) {
    return marked;
  }

  try {
    await deleteObject(sourceKey);
  } catch {
    // La foto lista ya apunta a la versión optimizada. El original se limpia en un reintento de borrado.
  }
  return { ok: true as const };
}

export async function reorderPropertyPhotos(propertyId: string, ids: string[]) {
  const db = await adminDb();
  if (!db.ok) {
    return db;
  }
  const { error } = await db.supabase.rpc("reorder_property_photos", {
    p_property_id: propertyId,
    p_ids: ids,
  });
  if (error) {
    return mapDbError(error, "No se pudo reordenar las fotos.");
  }
  return { ok: true as const };
}

export async function setPropertyCover(propertyId: string, photoId: string) {
  const db = await adminDb();
  if (!db.ok) {
    return db;
  }
  const { error } = await db.supabase.rpc("set_property_photo_cover", {
    p_property_id: propertyId,
    p_photo_id: photoId,
  });
  if (error) {
    return mapDbError(error, "No se pudo cambiar la portada.");
  }
  return { ok: true as const };
}

export async function deletePropertyPhoto(propertyId: string, photoId: string) {
  const db = await adminDb();
  if (!db.ok) {
    return db;
  }
  const existing = await getPhoto(db.supabase, propertyId, photoId);
  if (!existing.ok) {
    return existing;
  }
  if (existing.photo.status !== "deleting" && existing.photo.is_cover) {
    const { data: nextCover } = await db.supabase
      .from("property_photos")
      .select("id")
      .eq("property_id", propertyId)
      .eq("status", "ready")
      .neq("id", photoId)
      .order("position", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (nextCover?.id) {
      await db.supabase.rpc("set_property_photo_cover", {
        p_property_id: propertyId,
        p_photo_id: nextCover.id,
      });
    }
  }
  if (existing.photo.status !== "deleting") {
    const hidden = await markPhotoDeleting(db.supabase, propertyId, photoId);
    if (!hidden) {
      return { ok: false as const, message: "No se pudo ocultar la foto.", status: 500 };
    }
  }
  const removed = await finishPhotoDeletion(db.supabase, propertyId, photoId, existing.photo.object_key);
  if (!removed) {
    return {
      ok: false as const,
      message: "No se pudo borrar el archivo. La foto ya no se muestra y la limpieza se reintenta al abrir la ficha.",
      status: 502,
    };
  }
  return { ok: true as const };
}

export async function deleteAllPropertyPhotos(propertyId: string) {
  const db = await adminDb();
  if (!db.ok) {
    return db;
  }
  const { error: markError } = await db.supabase
    .from("property_photos")
    .update({ status: "deleting", is_cover: false })
    .eq("property_id", propertyId)
    .in("status", ["pending", "ready"]);
  if (markError) {
    return mapDbError(markError, "No se pudieron preparar las fotos para borrarlas.");
  }
  const { data, error } = await db.supabase
    .from("property_photos")
    .select("id, object_key")
    .eq("property_id", propertyId)
    .eq("status", "deleting");
  if (error) {
    return mapDbError(error, "No se pudieron leer las fotos de la propiedad.");
  }
  let blocked = false;
  for (const row of (data ?? []) as { id: string; object_key: string }[]) {
    const removed = await finishPhotoDeletion(db.supabase, propertyId, row.id, row.object_key);
    if (!removed) {
      blocked = true;
    }
  }
  if (blocked) {
    return {
      ok: false as const,
      message: "No se pudieron borrar todas las fotos. La propiedad sigue cargada. Las que ya se eliminaron no se muestran y podés reintentar.",
      status: 502,
    };
  }
  return { ok: true as const };
}
