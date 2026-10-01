"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { deleteAllPropertyPhotos } from "@/lib/photos/repository";
import { revalidatePublicViews } from "@/lib/properties/revalidate-public";
import { savePropertyRecord, type FieldErrorMap, type SaveResult } from "@/lib/properties/save-property";
import {
  deleteProperty,
  getProperty,
  publishErrors,
  updatePropertyFlags,
} from "@/lib/properties/repository";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type { FieldErrorMap, SaveResult };

export type MutationResult = { ok: true } | { ok: false; message: string };

function firstError(errors: FieldErrorMap) {
  return Object.values(errors)[0] ?? "Revisá los datos antes de publicar.";
}

export async function savePropertyAction(payload: unknown): Promise<SaveResult> {
  await requireAdmin();
  return savePropertyRecord(payload);
}

export async function publishPropertyAction(id: string): Promise<MutationResult> {
  await requireAdmin();
  if (!UUID_RE.test(id)) {
    return { ok: false, message: "La propiedad no es válida." };
  }
  const existing = await getProperty(id);
  if (!existing.ok) {
    return { ok: false, message: existing.message };
  }
  const errors = publishErrors(existing.property);
  if (Object.keys(errors).length > 0) {
    return { ok: false, message: firstError(errors) };
  }
  const updated = await updatePropertyFlags(id, { status: "PUBLICADA" });
  if (!updated.ok) {
    return { ok: false, message: updated.message };
  }
  revalidatePath("/admin");
  revalidatePath(`/admin/propiedades/${id}`);
  await revalidatePublicViews({ slug: updated.property.slug });
  return { ok: true };
}

export async function pausePropertyAction(id: string): Promise<MutationResult> {
  await requireAdmin();
  if (!UUID_RE.test(id)) {
    return { ok: false, message: "La propiedad no es válida." };
  }
  const updated = await updatePropertyFlags(id, { status: "PAUSADA" });
  if (!updated.ok) {
    return { ok: false, message: updated.message };
  }
  revalidatePath("/admin");
  revalidatePath(`/admin/propiedades/${id}`);
  await revalidatePublicViews({ slug: updated.property.slug });
  return { ok: true };
}

export async function setFeaturedAction(id: string, featured: boolean): Promise<MutationResult> {
  await requireAdmin();
  if (!UUID_RE.test(id) || typeof featured !== "boolean") {
    return { ok: false, message: "La propiedad no es válida." };
  }
  const updated = await updatePropertyFlags(id, { featured });
  if (!updated.ok) {
    return { ok: false, message: updated.message };
  }
  revalidatePath("/admin");
  revalidatePath(`/admin/propiedades/${id}`);
  if (updated.property.status === "PUBLICADA") {
    await revalidatePublicViews({ slug: updated.property.slug });
  }
  return { ok: true };
}

export async function deletePropertyAction(id: string): Promise<MutationResult> {
  await requireAdmin();
  if (!UUID_RE.test(id)) {
    return { ok: false, message: "La propiedad no es válida." };
  }
  const existing = await getProperty(id);
  if (!existing.ok) {
    return { ok: false, message: existing.message };
  }
  const cleaned = await deleteAllPropertyPhotos(id);
  if (!cleaned.ok && !cleaned.message.includes("Falta ejecutar la migración")) {
    return { ok: false, message: cleaned.message };
  }
  const deleted = await deleteProperty(id);
  if (!deleted.ok) {
    return { ok: false, message: deleted.message };
  }
  revalidatePath("/admin");
  if (existing.property.status !== "BORRADOR") {
    await revalidatePublicViews({ slug: existing.property.slug });
  }
  return { ok: true };
}
