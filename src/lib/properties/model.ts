export const PROPERTY_TYPES = ["Casa", "Departamento", "PH", "Local", "Lote"] as const;
export const PROPERTY_OPERATIONS = ["Venta", "Alquiler", "Temporal"] as const;
export const PROPERTY_STATUSES = ["BORRADOR", "PUBLICADA", "PAUSADA"] as const;
export const PROPERTY_CURRENCIES = ["ARS", "USD"] as const;
export const PRICE_PERIODS = ["mes", "semana", "dia", "temporada"] as const;
export const LOCATION_PRECISIONS = ["exact", "approximate"] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];
export type PropertyOperation = (typeof PROPERTY_OPERATIONS)[number];
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];
export type PropertyCurrency = (typeof PROPERTY_CURRENCIES)[number];
export type PricePeriod = (typeof PRICE_PERIODS)[number];
export type LocationPrecision = (typeof LOCATION_PRECISIONS)[number];

export type PropertyRecord = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  location: string | null;
  locationPrecision: LocationPrecision | null;
  propertyType: PropertyType | null;
  operation: PropertyOperation | null;
  price: number | null;
  currency: PropertyCurrency | null;
  priceOnRequest: boolean;
  pricePeriod: PricePeriod | null;
  bedrooms: number | null;
  bathrooms: number | null;
  rooms: number | null;
  garage: number | null;
  coveredAreaM2: number | null;
  totalAreaM2: number | null;
  landAreaM2: number | null;
  features: string[];
  status: PropertyStatus;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PropertyFormInput = {
  title: string;
  description: string;
  location: string;
  locationPrecision: string;
  propertyType: string;
  operation: string;
  priceOnRequest: boolean;
  price: string;
  currency: string;
  pricePeriod: string;
  bedrooms: string;
  bathrooms: string;
  rooms: string;
  garage: string;
  coveredAreaM2: string;
  totalAreaM2: string;
  landAreaM2: string;
  features: string[];
  featured: boolean;
};

export const STATUS_LABELS: Record<PropertyStatus, string> = {
  BORRADOR: "Borrador",
  PUBLICADA: "Publicada",
  PAUSADA: "Pausada",
};

export const PERIOD_LABELS: Record<PricePeriod, string> = {
  mes: "Por mes",
  semana: "Por semana",
  dia: "Por día",
  temporada: "Por temporada",
};

export const PRECISION_LABELS: Record<LocationPrecision, string> = {
  exact: "Exacta",
  approximate: "Aproximada",
};

const TYPES_WITH_BEDROOMS = new Set<PropertyType>(["Casa", "Departamento", "PH"]);

export function typeUsesBedrooms(type: PropertyType | null) {
  return type !== null && TYPES_WITH_BEDROOMS.has(type);
}

export function typeUsesInterior(type: PropertyType | null) {
  return type !== "Lote";
}

export function operationUsesPeriod(operation: PropertyOperation | null) {
  return operation === "Alquiler" || operation === "Temporal";
}

export function slugifyTitle(title: string) {
  const slug = title
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "propiedad";
}

export function formatPropertyPrice(property: Pick<
  PropertyRecord,
  "price" | "currency" | "priceOnRequest" | "pricePeriod" | "operation"
>) {
  if (property.priceOnRequest) {
    return "Consultar";
  }
  if (property.price === null || !property.currency) {
    return "Sin precio";
  }
  const amount = new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: Number.isInteger(property.price) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(property.price);
  const money = property.currency === "USD" ? `USD ${amount}` : `$ ${amount}`;
  if (property.pricePeriod && operationUsesPeriod(property.operation)) {
    const period = property.pricePeriod === "dia" ? "día" : property.pricePeriod;
    return `${money} / ${period}`;
  }
  return money;
}

export function formatAdminDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function emptyPropertyForm(): PropertyFormInput {
  return {
    title: "",
    description: "",
    location: "",
    locationPrecision: "",
    propertyType: "",
    operation: "",
    priceOnRequest: false,
    price: "",
    currency: "",
    pricePeriod: "",
    bedrooms: "",
    bathrooms: "",
    rooms: "",
    garage: "",
    coveredAreaM2: "",
    totalAreaM2: "",
    landAreaM2: "",
    features: [],
    featured: false,
  };
}

export function propertyToForm(property: PropertyRecord): PropertyFormInput {
  return {
    title: property.title,
    description: property.description ?? "",
    location: property.location ?? "",
    locationPrecision: property.locationPrecision ?? "",
    propertyType: property.propertyType ?? "",
    operation: property.operation ?? "",
    priceOnRequest: property.priceOnRequest,
    price: property.price === null ? "" : String(property.price).replace(".", ","),
    currency: property.currency ?? "",
    pricePeriod: property.pricePeriod ?? "",
    bedrooms: property.bedrooms === null ? "" : String(property.bedrooms),
    bathrooms: property.bathrooms === null ? "" : String(property.bathrooms),
    rooms: property.rooms === null ? "" : String(property.rooms),
    garage: property.garage === null ? "" : String(property.garage),
    coveredAreaM2: property.coveredAreaM2 === null ? "" : String(property.coveredAreaM2).replace(".", ","),
    totalAreaM2: property.totalAreaM2 === null ? "" : String(property.totalAreaM2).replace(".", ","),
    landAreaM2: property.landAreaM2 === null ? "" : String(property.landAreaM2).replace(".", ","),
    features: property.features,
    featured: property.featured,
  };
}
