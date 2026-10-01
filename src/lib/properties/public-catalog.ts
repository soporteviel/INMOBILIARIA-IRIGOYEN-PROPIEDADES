import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { canonicalLocationNames, foldLocation } from "@/lib/properties/locations";
import { PUBLIC_CATALOG_TAG } from "@/lib/properties/revalidate-public";
import { createPublicClient } from "@/lib/supabase/public";
import type {
  LocationPrecision,
  Property,
  PropertyCurrency,
  PropertyPhoto,
  PropertyPricePeriod,
} from "@/data/properties";

const PAGE_SIZE = 1000;
const CONNECTION_ERROR = "No pudimos conectar con las propiedades. Probá de nuevo en unos minutos.";

const PROPERTY_COLUMNS =
  "id, slug, title, description, location, location_precision, property_type, operation, price, currency, price_on_request, price_period, bedrooms, bathrooms, rooms, garage, covered_area_m2, total_area_m2, land_area_m2, features, featured, updated_at";

const OPERATIONS = new Set(["Venta", "Alquiler", "Temporal"]);
const PERIODS = new Set<PropertyPricePeriod>(["mes", "semana", "dia", "temporada"]);
const PRECISIONS = new Set<LocationPrecision>(["exact", "approximate"]);

type PropertyRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  location: string | null;
  location_precision: string | null;
  property_type: string | null;
  operation: string | null;
  price: number | string | null;
  currency: string | null;
  price_on_request: boolean;
  price_period: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  rooms: number | null;
  garage: number | null;
  covered_area_m2: number | string | null;
  total_area_m2: number | string | null;
  land_area_m2: number | string | null;
  features: string[] | null;
  featured: boolean;
  updated_at: string;
};

type PhotoRow = {
  id: string;
  property_id: string;
  position: number;
  is_cover: boolean;
};

export type PublicCatalog =
  | { ok: true; properties: Property[]; photosUnavailable: boolean }
  | { ok: false; message: string };

function toNumber(value: number | string | null) {
  if (value === null || value === "") {
    return null;
  }
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

function asCurrency(value: string | null): PropertyCurrency | null {
  return value === "ARS" || value === "USD" ? value : null;
}

function asPeriod(value: string | null): PropertyPricePeriod | null {
  return value !== null && PERIODS.has(value as PropertyPricePeriod) ? (value as PropertyPricePeriod) : null;
}

function asPrecision(value: string | null): LocationPrecision | undefined {
  return value !== null && PRECISIONS.has(value as LocationPrecision) ? (value as LocationPrecision) : undefined;
}

function publicPhotoPath(photoId: string) {
  return `/fotos/${photoId}`;
}

function cardArea(type: string, covered: number | null, land: number | null) {
  const value = type === "Lote" || type === "Terreno" ? land : covered;
  if (value === null) {
    return "—";
  }
  return `${new Intl.NumberFormat("es-AR").format(value)} m²`;
}

async function readPages<T>(
  load: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message?: string } | null }>,
) {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await load(from, from + PAGE_SIZE - 1);
    if (error) {
      throw new Error(error.message || CONNECTION_ERROR);
    }
    const page = data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) {
      return rows;
    }
  }
}

function mapProperties(rows: PropertyRow[], photos: PhotoRow[]): Property[] {
  const canonical = canonicalLocationNames(rows.map((row) => row.location));
  const byFold = new Map(canonical.map((name) => [foldLocation(name), name]));
  const photosByProperty = new Map<string, PhotoRow[]>();
  for (const photo of photos) {
    const list = photosByProperty.get(photo.property_id) ?? [];
    list.push(photo);
    photosByProperty.set(photo.property_id, list);
  }

  return rows.map((row) => {
    const location = row.location ? (byFold.get(foldLocation(row.location)) ?? row.location) : "";
    const type = row.property_type ?? "";
    const operation = row.operation && OPERATIONS.has(row.operation) ? row.operation : (row.operation ?? "");
    const ordered = [...(photosByProperty.get(row.id) ?? [])].sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));
    const gallery: PropertyPhoto[] = ordered.map((photo, index) => ({
      id: photo.id,
      src: publicPhotoPath(photo.id),
      alt: location ? `${row.title} en ${location}, foto ${index + 1}` : `${row.title}, foto ${index + 1}`,
    }));
    const cover = ordered.find((photo) => photo.is_cover) ?? ordered[0] ?? null;
    const coverPhoto = cover ? gallery.find((photo) => photo.id === cover.id) ?? null : null;
    const covered = toNumber(row.covered_area_m2);
    const land = toNumber(row.land_area_m2);

    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      location,
      locationPrecision: asPrecision(row.location_precision),
      type,
      operation,
      price: toNumber(row.price),
      currency: asCurrency(row.currency),
      priceOnRequest: row.price_on_request,
      pricePeriod: asPeriod(row.price_period),
      bedrooms: row.bedrooms,
      bathrooms: row.bathrooms,
      area: cardArea(type, covered, land),
      image: coverPhoto?.src ?? null,
      imageAlt: coverPhoto?.alt ?? row.title,
      rooms: row.rooms,
      garage: row.garage,
      coveredAreaM2: covered,
      totalAreaM2: toNumber(row.total_area_m2),
      landAreaM2: land,
      description: row.description ?? undefined,
      features: row.features ?? [],
      photos: gallery,
      featured: row.featured,
    };
  });
}

async function loadPropertyRows() {
  const supabase = createPublicClient();
  if (!supabase) {
    throw new Error(CONNECTION_ERROR);
  }
  return readPages<PropertyRow>((from, to) =>
    supabase
      .from("properties")
      .select(PROPERTY_COLUMNS)
      .eq("status", "PUBLICADA")
      .order("updated_at", { ascending: false })
      .order("id", { ascending: true })
      .range(from, to),
  );
}

async function loadReadyPhotos() {
  const supabase = createPublicClient();
  if (!supabase) {
    throw new Error(CONNECTION_ERROR);
  }
  return readPages<PhotoRow>((from, to) =>
    supabase
      .from("property_photos")
      .select("id, property_id, position, is_cover")
      .eq("status", "ready")
      .order("position", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to),
  );
}

const readCachedRows = unstable_cache(loadPropertyRows, ["public-properties-v1"], {
  tags: [PUBLIC_CATALOG_TAG],
  revalidate: false,
});

export const getPublishedCatalog = cache(async (): Promise<PublicCatalog> => {
  let rows: PropertyRow[];
  try {
    rows = await readCachedRows();
  } catch {
    return { ok: false, message: CONNECTION_ERROR };
  }

  try {
    const photos = await loadReadyPhotos();
    return { ok: true, properties: mapProperties(rows, photos), photosUnavailable: false };
  } catch {
    return { ok: true, properties: mapProperties(rows, []), photosUnavailable: true };
  }
});
