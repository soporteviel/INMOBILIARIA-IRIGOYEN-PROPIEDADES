import {
  LOCATION_PRECISIONS,
  operationUsesPeriod,
  PRICE_PERIODS,
  PROPERTY_CURRENCIES,
  PROPERTY_OPERATIONS,
  PROPERTY_TYPES,
  typeUsesBedrooms,
  type LocationPrecision,
  type PricePeriod,
  type PropertyCurrency,
  type PropertyFormInput,
  type PropertyOperation,
  type PropertyType,
} from "@/lib/properties/model";

export type NormalizedProperty = {
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
  featured: boolean;
};

export type FieldErrors = Partial<Record<keyof PropertyFormInput | "form", string>>;

const TITLE_MAX = 160;
const TEXT_MAX = 160;
const DESCRIPTION_MAX = 8000;
const PRICE_MAX = 999_999_999_999.99;

function asChoice<T extends string>(value: string, options: readonly T[]): T | null {
  return options.includes(value as T) ? (value as T) : null;
}

export function parseLocalizedNumber(raw: string): { ok: true; value: number | null } | { ok: false } {
  const compact = raw.trim().replace(/\s/g, "");
  if (!compact) {
    return { ok: true, value: null };
  }

  let normalized = compact;
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(compact)) {
    normalized = compact.replace(/\./g, "").replace(",", ".");
  } else if (/^\d+(,\d{1,2})$/.test(compact)) {
    normalized = compact.replace(",", ".");
  } else if (!/^\d+(\.\d{1,2})?$/.test(compact)) {
    return { ok: false };
  }

  const value = Number(normalized);
  if (!Number.isFinite(value)) {
    return { ok: false };
  }
  return { ok: true, value };
}

function parseWholeNumber(raw: string, label: string, errors: FieldErrors, key: keyof PropertyFormInput) {
  const parsed = parseLocalizedNumber(raw);
  if (!parsed.ok || (parsed.value !== null && !Number.isInteger(parsed.value))) {
    errors[key] = `${label} tiene que ser un número entero, o quedar vacío si no lo sabés.`;
    return null;
  }
  if (parsed.value !== null && parsed.value < 0) {
    errors[key] = `${label} no puede ser negativo. Dejalo vacío si no lo sabés.`;
    return null;
  }
  return parsed.value;
}

function parseMeasure(raw: string, label: string, errors: FieldErrors, key: keyof PropertyFormInput) {
  const parsed = parseLocalizedNumber(raw);
  if (!parsed.ok) {
    errors[key] = `${label} tiene que ser un número, o quedar vacía si no la sabés.`;
    return null;
  }
  if (parsed.value !== null && parsed.value < 0) {
    errors[key] = `${label} no puede ser negativa.`;
    return null;
  }
  return parsed.value;
}

function cleanText(value: string, max: number) {
  const trimmed = value.trim().replace(/\s+\n/g, "\n");
  return trimmed.slice(0, max);
}

export function normalizeProperty(
  input: PropertyFormInput,
  intent: "draft" | "publish",
): { value: NormalizedProperty | null; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const title = cleanText(input.title ?? "", TITLE_MAX);
  if (!title) {
    errors.title = "El título es obligatorio.";
  }

  const description = cleanText(input.description ?? "", DESCRIPTION_MAX);
  const location = cleanText(input.location ?? "", TEXT_MAX);
  const propertyType = asChoice(input.propertyType ?? "", PROPERTY_TYPES);
  const operation = asChoice(input.operation ?? "", PROPERTY_OPERATIONS);
  const locationPrecision = asChoice(input.locationPrecision ?? "", LOCATION_PRECISIONS);
  const currency = asChoice(input.currency ?? "", PROPERTY_CURRENCIES);
  const pricePeriod = asChoice(input.pricePeriod ?? "", PRICE_PERIODS);

  if ((input.propertyType ?? "") && !propertyType) {
    errors.propertyType = "Elegí un tipo de la lista.";
  }
  if ((input.operation ?? "") && !operation) {
    errors.operation = "Elegí una operación de la lista.";
  }
  if ((input.locationPrecision ?? "") && !locationPrecision) {
    errors.locationPrecision = "Elegí una precisión de la lista.";
  }
  if ((input.currency ?? "") && !currency) {
    errors.currency = "Elegí pesos o dólares.";
  }
  if ((input.pricePeriod ?? "") && !pricePeriod) {
    errors.pricePeriod = "Elegí un período de la lista.";
  }

  const priceOnRequest = input.priceOnRequest === true;
  let price: number | null = null;
  if (!priceOnRequest && (input.price ?? "").trim()) {
    const parsed = parseLocalizedNumber(input.price);
    if (!parsed.ok) {
      errors.price = "El precio tiene que ser un número mayor que cero.";
    } else if (parsed.value === 0) {
      errors.price = "Si el precio no está definido, marcá Consultar precio. No uses cero.";
    } else if (parsed.value !== null && parsed.value < 0) {
      errors.price = "El precio no puede ser negativo.";
    } else if (parsed.value !== null && parsed.value > PRICE_MAX) {
      errors.price = "El precio es demasiado alto.";
    } else {
      price = parsed.value;
    }
  }

  if (!priceOnRequest && price !== null && !currency) {
    errors.currency = "Indicá si el precio está en pesos o en dólares.";
  }
  if (!priceOnRequest && price === null && currency && !(input.price ?? "").trim()) {
    errors.price = "Ingresá el monto o marcá Consultar precio.";
  }

  let bedrooms =
    propertyType === null || typeUsesBedrooms(propertyType)
      ? parseWholeNumber(input.bedrooms ?? "", "Los dormitorios", errors, "bedrooms")
      : null;
  let bathrooms = parseWholeNumber(input.bathrooms ?? "", "Los baños", errors, "bathrooms");
  let rooms = parseWholeNumber(input.rooms ?? "", "Los ambientes", errors, "rooms");
  let garage = parseWholeNumber(input.garage ?? "", "Las cocheras", errors, "garage");
  const coveredAreaM2 = parseMeasure(input.coveredAreaM2 ?? "", "La superficie cubierta", errors, "coveredAreaM2");
  const totalAreaM2 = parseMeasure(input.totalAreaM2 ?? "", "La superficie total", errors, "totalAreaM2");
  const landAreaM2 = parseMeasure(input.landAreaM2 ?? "", "La superficie del terreno", errors, "landAreaM2");

  if (propertyType === "Lote") {
    bedrooms = null;
    bathrooms = null;
    rooms = null;
    garage = null;
    delete errors.bedrooms;
    delete errors.bathrooms;
    delete errors.rooms;
    delete errors.garage;
  } else if (propertyType === "Local") {
    bedrooms = null;
    delete errors.bedrooms;
  }

  if (
    coveredAreaM2 !== null &&
    totalAreaM2 !== null &&
    coveredAreaM2 > totalAreaM2 &&
    propertyType !== "Lote"
  ) {
    errors.coveredAreaM2 = "La superficie cubierta no puede ser mayor que la total.";
  }

  const features = Array.from(
    new Set(
      (Array.isArray(input.features) ? input.features : [])
        .filter((feature): feature is string => typeof feature === "string")
        .map((feature) => feature.trim())
        .filter(Boolean)
        .map((feature) => feature.slice(0, 80)),
    ),
  ).slice(0, 40);

  if (intent === "publish") {
    if (!location) {
      errors.location = "Para publicar, indicá la ubicación.";
    }
    if (!propertyType) {
      errors.propertyType = "Para publicar, elegí el tipo de propiedad.";
    }
    if (!operation) {
      errors.operation = "Para publicar, elegí venta, alquiler o temporal.";
    }
    if (!priceOnRequest && price === null) {
      errors.price = errors.price ?? "Para publicar, ingresá el precio o marcá Consultar precio.";
    }
    if (!priceOnRequest && price !== null && !currency) {
      errors.currency = errors.currency ?? "Indicá si el precio está en pesos o en dólares.";
    }
    if (!priceOnRequest && operationUsesPeriod(operation) && !pricePeriod) {
      errors.pricePeriod = "Para publicar un alquiler o un temporal, indicá el período del precio.";
    }
  }

  if (Object.keys(errors).length > 0) {
    return { value: null, errors };
  }

  const resolvedPriceOnRequest = priceOnRequest;
  const resolvedPrice = resolvedPriceOnRequest ? null : price;
  const resolvedCurrency = resolvedPriceOnRequest || resolvedPrice === null ? null : currency;
  const resolvedPeriod =
    resolvedPriceOnRequest || !operationUsesPeriod(operation) ? null : pricePeriod;

  return {
    value: {
      title,
      description: description || null,
      location: location || null,
      locationPrecision,
      propertyType,
      operation,
      price: resolvedPrice,
      currency: resolvedCurrency,
      priceOnRequest: resolvedPriceOnRequest,
      pricePeriod: resolvedPeriod,
      bedrooms,
      bathrooms: propertyType === "Lote" ? null : bathrooms,
      rooms: propertyType === "Lote" ? null : rooms,
      garage: propertyType === "Lote" ? null : garage,
      coveredAreaM2,
      totalAreaM2,
      landAreaM2,
      features,
      featured: input.featured === true,
    },
    errors,
  };
}

export function isPropertyFormInput(value: unknown): value is PropertyFormInput {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  const strings = [
    "title",
    "description",
    "location",
    "locationPrecision",
    "propertyType",
    "operation",
    "price",
    "currency",
    "pricePeriod",
    "bedrooms",
    "bathrooms",
    "rooms",
    "garage",
    "coveredAreaM2",
    "totalAreaM2",
    "landAreaM2",
  ];
  return (
    strings.every((key) => typeof record[key] === "string") &&
    typeof record.priceOnRequest === "boolean" &&
    typeof record.featured === "boolean" &&
    Array.isArray(record.features)
  );
}
