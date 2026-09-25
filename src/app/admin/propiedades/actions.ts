"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import {
  deleteProperty,
  getProperty,
  insertProperty,
  publishErrors,
  updateProperty,
  updatePropertyFlags,
} from "@/lib/properties/repository";
import { isPropertyFormInput, normalizeProperty } from "@/lib/properties/validation";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type FieldErrorMap = Record<string, string>;

export type MutationResult = { ok: true } | { ok: false; message: string };

export type SaveResult = {
  ok: false;
  message: string;
  fieldErrors: FieldErrorMap;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function firstError(errors: FieldErrorMap) {
  return Object.values(errors)[0] ?? "Revisá los datos antes de publicar.";
}

export async function savePropertyAction(payload: unknown): Promise<SaveResult> {
  await requireAdmin();
  if (
    !isRecord(payload) ||
    (payload.intent !== "save" && payload.intent !== "publish" && payload.intent !== "pause") ||
    !isPropertyFormInput(payload.values)
  ) {
    return { ok: false, message: "No se pudo leer el formulario.", fieldErrors: {} };
  }

  const id = typeof payload.id === "string" && payload.id ? payload.id : null;
  if (id && !UUID_RE.test(id)) {
    return { ok: false, message: "La propiedad no es válida.", fieldErrors: {} };
  }

  const validationIntent = payload.intent === "publish" ? "publish" : "draft";
  let normalized = normalizeProperty(payload.values, validationIntent);
  if (!normalized.value) {
    return {
      ok: false,
      message: "Revisá los campos marcados.",
      fieldErrors: normalized.errors,
    };
  }

  if (!id) {
    const created = await insertProperty(
      normalized.value,
      payload.intent === "publish" ? "PUBLICADA" : "BORRADOR",
    );
    if (!created.ok) {
      return { ok: false, message: created.message, fieldErrors: {} };
    }
    revalidatePath("/admin");
    redirect(`/admin/propiedades/${created.property.id}?guardado=1`);
  }

  const existing = await getProperty(id);
  if (!existing.ok) {
    return { ok: false, message: existing.message, fieldErrors: {} };
  }

  let status = existing.property.status;
  if (payload.intent === "publish") {
    status = "PUBLICADA";
  } else if (payload.intent === "pause") {
    status = "PAUSADA";
  } else if (status === "PUBLICADA") {
    normalized = normalizeProperty(payload.values, "publish");
    if (!normalized.value) {
      return {
        ok: false,
        message: "Una propiedad publicada necesita estos datos.",
        fieldErrors: normalized.errors,
      };
    }
  }

  const updated = await updateProperty(id, normalized.value, status);
  if (!updated.ok) {
    return { ok: false, message: updated.message, fieldErrors: {} };
  }
  revalidatePath("/admin");
  revalidatePath(`/admin/propiedades/${id}`);
  redirect(`/admin/propiedades/${id}?guardado=1`);
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
  return { ok: true };
}

export async function deletePropertyAction(id: string): Promise<MutationResult> {
  await requireAdmin();
  if (!UUID_RE.test(id)) {
    return { ok: false, message: "La propiedad no es válida." };
  }
  const deleted = await deleteProperty(id);
  if (!deleted.ok) {
    return { ok: false, message: deleted.message };
  }
  revalidatePath("/admin");
  return { ok: true };
}
