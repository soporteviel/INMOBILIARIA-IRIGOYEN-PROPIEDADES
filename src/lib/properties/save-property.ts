import "server-only";

import { revalidatePath } from "next/cache";
import { devTiming } from "@/lib/dev/timing";
import { getAuthState } from "@/lib/auth/session";
import {
  getProperty,
  insertProperty,
  updateProperty,
} from "@/lib/properties/repository";
import { revalidatePublicViews } from "@/lib/properties/revalidate-public";
import type { PropertyStatus } from "@/lib/properties/model";
import { isPropertyFormInput, normalizeProperty } from "@/lib/properties/validation";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type FieldErrorMap = Record<string, string>;

export type SaveResult =
  | { ok: true; id: string; status: PropertyStatus; slug: string }
  | {
      ok: false;
      message: string;
      fieldErrors: FieldErrorMap;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function affectsPublicCatalog(before: PropertyStatus | null, after: PropertyStatus) {
  return before === "PUBLICADA" || after === "PUBLICADA";
}

function markAdmin(id: string | null) {
  revalidatePath("/admin");
  if (id) {
    revalidatePath(`/admin/propiedades/${id}`);
  }
}

export async function savePropertyRecord(payload: unknown): Promise<SaveResult> {
  const started = performance.now();
  const authStarted = performance.now();
  const auth = await getAuthState();
  devTiming("guardar", "auth", authStarted);
  if (auth.status !== "authenticated" || !auth.isAdmin || auth.mustChangePassword) {
    return { ok: false, message: "Tenés que iniciar sesión.", fieldErrors: {} };
  }

  if (
    !isRecord(payload) ||
    (payload.intent !== "save" && payload.intent !== "publish" && payload.intent !== "pause") ||
    !isPropertyFormInput(payload.values)
  ) {
    return { ok: false, message: "No se pudo leer el formulario.", fieldErrors: {} };
  }

  const deferPublic = payload.deferPublic === true && payload.intent === "save";
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
    const writeStarted = performance.now();
    const created = await insertProperty(
      normalized.value,
      payload.intent === "publish" ? "PUBLICADA" : "BORRADOR",
    );
    devTiming("guardar", "escritura", writeStarted, "nueva");
    if (!created.ok) {
      return { ok: false, message: created.message, fieldErrors: {} };
    }
    const invalidateStarted = performance.now();
    markAdmin(created.property.id);
    if (!deferPublic && affectsPublicCatalog(null, created.property.status)) {
      await revalidatePublicViews({ slug: created.property.slug });
    }
    devTiming("guardar", "invalidacion", invalidateStarted, created.property.status);
    devTiming("guardar", "total", started, `nueva ${payload.intent}`);
    return {
      ok: true,
      id: created.property.id,
      status: created.property.status,
      slug: created.property.slug,
    };
  }

  const readStarted = performance.now();
  const existing = await getProperty(id);
  devTiming("guardar", "consulta", readStarted);
  if (!existing.ok) {
    return { ok: false, message: existing.message, fieldErrors: {} };
  }

  const before = existing.property.status;
  let status = before;
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

  const writeStarted = performance.now();
  const updated = await updateProperty(id, normalized.value, status);
  devTiming("guardar", "escritura", writeStarted, "editar");
  if (!updated.ok) {
    return { ok: false, message: updated.message, fieldErrors: {} };
  }

  const invalidateStarted = performance.now();
  markAdmin(id);
  if (!deferPublic && affectsPublicCatalog(before, updated.property.status)) {
    await revalidatePublicViews({
      slug: updated.property.slug,
      previousSlug: existing.property.slug,
    });
  }
  devTiming("guardar", "invalidacion", invalidateStarted, `${before}->${updated.property.status}`);
  devTiming("guardar", "total", started, `editar ${payload.intent}`);
  return {
    ok: true,
    id,
    status: updated.property.status,
    slug: updated.property.slug,
  };
}
