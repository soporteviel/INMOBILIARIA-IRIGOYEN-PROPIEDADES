import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/session";
import {
  slugifyTitle,
  type LocationPrecision,
  type PricePeriod,
  type PropertyCurrency,
  type PropertyOperation,
  type PropertyRecord,
  type PropertyStatus,
  type PropertyType,
} from "@/lib/properties/model";
import { normalizeProperty, type NormalizedProperty } from "@/lib/properties/validation";

const PROPERTY_COLUMNS =
  "id, slug, title, description, location, location_precision, property_type, operation, price, currency, price_on_request, price_period, bedrooms, bathrooms, rooms, garage, covered_area_m2, total_area_m2, land_area_m2, features, status, featured, created_at, updated_at";

type PropertyRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  location: string | null;
  location_precision: LocationPrecision | null;
  property_type: PropertyType | null;
  operation: PropertyOperation | null;
  price: number | string | null;
  currency: PropertyCurrency | null;
  price_on_request: boolean;
  price_period: PricePeriod | null;
  bedrooms: number | null;
  bathrooms: number | null;
  rooms: number | null;
  garage: number | null;
  covered_area_m2: number | string | null;
  total_area_m2: number | string | null;
  land_area_m2: number | string | null;
  features: string[] | null;
  status: PropertyStatus;
  featured: boolean;
  created_at: string;
  updated_at: string;
};

export type RepositoryError = {
  ok: false;
  code: "missing_table" | "not_found" | "conflict" | "invalid" | "forbidden" | "error";
  message: string;
};

function toNumber(value: number | string | null) {
  if (value === null || value === "") {
    return null;
  }
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

function mapRow(row: PropertyRow): PropertyRecord {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    location: row.location,
    locationPrecision: row.location_precision,
    propertyType: row.property_type,
    operation: row.operation,
    price: toNumber(row.price),
    currency: row.currency,
    priceOnRequest: row.price_on_request,
    pricePeriod: row.price_period,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    rooms: row.rooms,
    garage: row.garage,
    coveredAreaM2: toNumber(row.covered_area_m2),
    totalAreaM2: toNumber(row.total_area_m2),
    landAreaM2: toNumber(row.land_area_m2),
    features: row.features ?? [],
    status: row.status,
    featured: row.featured,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isMissingTable(error: { code?: string; message?: string } | null) {
  if (!error) {
    return false;
  }
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    /could not find the table/i.test(error.message ?? "") ||
    /schema cache/i.test(error.message ?? "")
  );
}

function failure(error: { code?: string; message?: string } | null, fallback: string): RepositoryError {
  if (isMissingTable(error)) {
    return {
      ok: false,
      code: "missing_table",
      message:
        "Falta crear la tabla de propiedades. Ejecutá supabase/migrations/20260925001200_create_properties.sql en el proyecto beymsocusbarjwolyrlz y recargá esta pantalla.",
    };
  }
  if (error?.code === "23505") {
    return { ok: false, code: "conflict", message: "Ya existe una propiedad con ese identificador." };
  }
  if (error?.code === "23514") {
    return { ok: false, code: "invalid", message: "Hay datos que no cumplen las reglas de la ficha." };
  }
  if (error?.code === "42501" || /row-level security/i.test(error?.message ?? "")) {
    return { ok: false, code: "forbidden", message: "No tenés permiso para modificar propiedades." };
  }
  return { ok: false, code: "error", message: fallback };
}

function toRow(value: NormalizedProperty, status: PropertyStatus) {
  return {
    title: value.title,
    description: value.description,
    location: value.location,
    location_precision: value.locationPrecision,
    property_type: value.propertyType,
    operation: value.operation,
    price: value.price,
    currency: value.currency,
    price_on_request: value.priceOnRequest,
    price_period: value.pricePeriod,
    bedrooms: value.bedrooms,
    bathrooms: value.bathrooms,
    rooms: value.rooms,
    garage: value.garage,
    covered_area_m2: value.coveredAreaM2,
    total_area_m2: value.totalAreaM2,
    land_area_m2: value.landAreaM2,
    features: value.features,
    status,
    featured: value.featured,
    updated_at: new Date().toISOString(),
  };
}

async function adminDb() {
  await requireAdmin();
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false as const, error: { ok: false as const, code: "error" as const, message: "Falta la configuración de Supabase." } };
  }
  return { ok: true as const, supabase };
}

export async function listProperties(filters: { query: string; status: PropertyStatus | null }) {
  const db = await adminDb();
  if (!db.ok) {
    return db.error;
  }

  let request = db.supabase
    .from("properties")
    .select(PROPERTY_COLUMNS)
    .order("updated_at", { ascending: false })
    .limit(200);

  if (filters.status) {
    request = request.eq("status", filters.status);
  }
  const query = filters.query.replace(/[%_,.()]/g, "").trim();
  if (query) {
    request = request.or(`title.ilike.%${query}%,location.ilike.%${query}%`);
  }

  const { data, error } = await request;
  if (error) {
    return failure(error, "No se pudo cargar el listado.");
  }
  return { ok: true as const, properties: ((data ?? []) as PropertyRow[]).map(mapRow) };
}

export async function getProperty(id: string) {
  const db = await adminDb();
  if (!db.ok) {
    return db.error;
  }
  const { data, error } = await db.supabase
    .from("properties")
    .select(PROPERTY_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    return failure(error, "No se pudo abrir la propiedad.");
  }
  if (!data) {
    return { ok: false as const, code: "not_found" as const, message: "No encontramos esa propiedad." };
  }
  return { ok: true as const, property: mapRow(data as PropertyRow) };
}

async function uniqueSlug(supabase: Awaited<ReturnType<typeof createClient>>, title: string) {
  const base = slugifyTitle(title);
  if (!supabase) {
    return base;
  }
  for (let index = 1; index <= 50; index += 1) {
    const candidate = index === 1 ? base : `${base}-${index}`;
    const { data, error } = await supabase.from("properties").select("id").eq("slug", candidate).maybeSingle();
    if (error) {
      throw error;
    }
    if (!data) {
      return candidate;
    }
  }
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function insertProperty(value: NormalizedProperty, status: PropertyStatus) {
  const db = await adminDb();
  if (!db.ok) {
    return db.error;
  }
  let slug: string;
  try {
    slug = await uniqueSlug(db.supabase, value.title);
  } catch (error) {
    return failure(error as { code?: string; message?: string }, "No se pudo preparar el identificador.");
  }
  const { data, error } = await db.supabase
    .from("properties")
    .insert({ ...toRow(value, status), slug })
    .select(PROPERTY_COLUMNS)
    .single();
  if (error) {
    return failure(error, "No se pudo crear la propiedad.");
  }
  return { ok: true as const, property: mapRow(data as PropertyRow) };
}

export async function updateProperty(id: string, value: NormalizedProperty, status: PropertyStatus) {
  const db = await adminDb();
  if (!db.ok) {
    return db.error;
  }
  const { data, error } = await db.supabase
    .from("properties")
    .update(toRow(value, status))
    .eq("id", id)
    .select(PROPERTY_COLUMNS)
    .maybeSingle();
  if (error) {
    return failure(error, "No se pudo guardar la propiedad.");
  }
  if (!data) {
    return { ok: false as const, code: "not_found" as const, message: "No encontramos esa propiedad." };
  }
  return { ok: true as const, property: mapRow(data as PropertyRow) };
}

export async function updatePropertyFlags(
  id: string,
  changes: { status?: PropertyStatus; featured?: boolean },
) {
  const db = await adminDb();
  if (!db.ok) {
    return db.error;
  }
  const { data, error } = await db.supabase
    .from("properties")
    .update({ ...changes, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(PROPERTY_COLUMNS)
    .maybeSingle();
  if (error) {
    return failure(error, "No se pudo actualizar la propiedad.");
  }
  if (!data) {
    return { ok: false as const, code: "not_found" as const, message: "No encontramos esa propiedad." };
  }
  return { ok: true as const, property: mapRow(data as PropertyRow) };
}

export async function deleteProperty(id: string) {
  const db = await adminDb();
  if (!db.ok) {
    return db.error;
  }
  const { data, error } = await db.supabase
    .from("properties")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) {
    return failure(error, "No se pudo eliminar la propiedad.");
  }
  if (!data?.length) {
    return { ok: false as const, code: "not_found" as const, message: "No encontramos esa propiedad." };
  }
  return { ok: true as const };
}

export function publishErrors(property: PropertyRecord) {
  const form = {
    title: property.title,
    description: property.description ?? "",
    location: property.location ?? "",
    locationPrecision: property.locationPrecision ?? "",
    propertyType: property.propertyType ?? "",
    operation: property.operation ?? "",
    priceOnRequest: property.priceOnRequest,
    price: property.price === null ? "" : String(property.price),
    currency: property.currency ?? "",
    pricePeriod: property.pricePeriod ?? "",
    bedrooms: property.bedrooms === null ? "" : String(property.bedrooms),
    bathrooms: property.bathrooms === null ? "" : String(property.bathrooms),
    rooms: property.rooms === null ? "" : String(property.rooms),
    garage: property.garage === null ? "" : String(property.garage),
    coveredAreaM2: property.coveredAreaM2 === null ? "" : String(property.coveredAreaM2),
    totalAreaM2: property.totalAreaM2 === null ? "" : String(property.totalAreaM2),
    landAreaM2: property.landAreaM2 === null ? "" : String(property.landAreaM2),
    features: property.features,
    featured: property.featured,
  };
  return normalizeProperty(form, "publish").errors;
}
