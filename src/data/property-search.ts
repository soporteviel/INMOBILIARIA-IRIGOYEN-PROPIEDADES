import {
  detectCurrency,
  getPublishedProperties,
  propertyUsesBedrooms,
  type Property,
} from "@/data/properties";

export const PROPERTY_SEARCH_KEYS = {
  operation: "operacion",
  location: "ubicacion",
  type: "tipo",
  currency: "moneda",
  priceMin: "precioDesde",
  priceMax: "precioHasta",
  bedrooms: "dormitorios",
  surfaceMin: "superficieDesde",
  surfaceMax: "superficieHasta",
  garage: "cochera",
} as const;

const BEDROOM_OPTIONS = ["1", "2", "3", "4+"] as const;
const GARAGE_OPTIONS = ["Sí", "No"] as const;

export type PropertyCurrency = "USD" | "ARS";
export type BedroomFilter = (typeof BEDROOM_OPTIONS)[number];
export type GarageFilter = (typeof GARAGE_OPTIONS)[number];

export type PropertySearch = {
  operation: Property["operation"] | null;
  location: string | null;
  type: string | null;
  currency: PropertyCurrency | null;
  priceMin: number | null;
  priceMax: number | null;
  bedrooms: BedroomFilter | null;
  surfaceMin: number | null;
  surfaceMax: number | null;
  garage: GarageFilter | null;
};

export type PropertyFilterControls = {
  operacion: string;
  ubicacion: string;
  tipo: string;
  moneda: PropertyCurrency;
  precioDesde: string;
  precioHasta: string;
  dormitorios: string;
  superficieDesde: string;
  superficieHasta: string;
  cochera: string;
};

type SearchInput =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

const OPERATIONS = new Set<Property["operation"]>(["Venta", "Alquiler", "Temporal"]);

function readParam(input: SearchInput, key: string) {
  if (input instanceof URLSearchParams) {
    const value = input.get(key);
    return value?.trim() ? value.trim() : null;
  }
  const value = input[key];
  const first = Array.isArray(value) ? value[0] : value;
  return first?.trim() ? first.trim() : null;
}

function parseNonNegativeInteger(raw: string | null) {
  if (!raw) {
    return null;
  }
  const compact = raw.replace(/\s/g, "");
  const normalized = /^\d{1,3}(\.\d{3})+$/.test(compact)
    ? compact.replace(/\./g, "")
    : compact;
  if (!/^\d+$/.test(normalized)) {
    return null;
  }
  const number = Number(normalized);
  if (!Number.isSafeInteger(number)) {
    return null;
  }
  return number;
}

function orderedRange(min: number | null, max: number | null) {
  if (min !== null && max !== null && min > max) {
    return { min: null, max: null };
  }
  return { min, max };
}

export function priceAmount(price: string) {
  if (!detectCurrency(price)) {
    return null;
  }
  const digits = price.replace(/\D/g, "");
  if (!digits) {
    return null;
  }
  const amount = Number(digits);
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    return null;
  }
  return amount;
}

function comparableSurface(property: Property) {
  if (property.type === "Lote") {
    return property.landAreaM2;
  }
  return property.coveredAreaM2;
}

export function parsePropertySearch(input: SearchInput): PropertySearch {
  const catalog = getPublishedProperties();
  const locations = new Set(catalog.map((property) => property.location));
  const types = new Set(catalog.map((property) => property.type));

  const operationValue = readParam(input, PROPERTY_SEARCH_KEYS.operation);
  const operation = OPERATIONS.has(operationValue as Property["operation"])
    ? (operationValue as Property["operation"])
    : null;

  const locationValue = readParam(input, PROPERTY_SEARCH_KEYS.location);
  const location =
    locationValue && locations.has(locationValue) ? locationValue : null;

  const typeValue = readParam(input, PROPERTY_SEARCH_KEYS.type);
  const type = typeValue && types.has(typeValue) ? typeValue : null;

  const currencyValue = readParam(input, PROPERTY_SEARCH_KEYS.currency);
  const currency =
    currencyValue === "USD" || currencyValue === "ARS" ? currencyValue : null;

  const priceRange = orderedRange(
    parseNonNegativeInteger(readParam(input, PROPERTY_SEARCH_KEYS.priceMin)),
    parseNonNegativeInteger(readParam(input, PROPERTY_SEARCH_KEYS.priceMax)),
  );
  const hasPrice = priceRange.min !== null || priceRange.max !== null;
  const priceMin = currency && hasPrice ? priceRange.min : null;
  const priceMax = currency && hasPrice ? priceRange.max : null;
  const appliedCurrency = priceMin !== null || priceMax !== null ? currency : null;

  const bedroomValue = readParam(input, PROPERTY_SEARCH_KEYS.bedrooms);
  const bedrooms =
    BEDROOM_OPTIONS.find((option) => option === bedroomValue) ?? null;
  const bedroomsApply =
    bedrooms !== null && (type === null || propertyUsesBedrooms(type));

  const surfaceRange = orderedRange(
    parseNonNegativeInteger(readParam(input, PROPERTY_SEARCH_KEYS.surfaceMin)),
    parseNonNegativeInteger(readParam(input, PROPERTY_SEARCH_KEYS.surfaceMax)),
  );

  const garageValue = readParam(input, PROPERTY_SEARCH_KEYS.garage);
  const garage = GARAGE_OPTIONS.find((option) => option === garageValue) ?? null;

  return {
    operation,
    location,
    type,
    currency: appliedCurrency,
    priceMin,
    priceMax,
    bedrooms: bedroomsApply ? bedrooms : null,
    surfaceMin: surfaceRange.min,
    surfaceMax: surfaceRange.max,
    garage,
  };
}

export function hasActivePropertySearch(search: PropertySearch) {
  return Object.values(search).some((value) => value !== null);
}

export function controlsFromSearch(
  search: PropertySearch,
  fallbackCurrency: PropertyCurrency,
): PropertyFilterControls {
  return {
    operacion: search.operation ?? "",
    ubicacion: search.location ?? "Todas",
    tipo: search.type ?? "Todos",
    moneda: search.currency ?? fallbackCurrency,
    precioDesde: search.priceMin?.toString() ?? "",
    precioHasta: search.priceMax?.toString() ?? "",
    dormitorios: search.bedrooms ?? "Todos",
    superficieDesde: search.surfaceMin?.toString() ?? "",
    superficieHasta: search.surfaceMax?.toString() ?? "",
    cochera: search.garage ?? "Todas",
  };
}

export function searchFromControls(controls: PropertyFilterControls) {
  const params = new URLSearchParams();
  if (controls.operacion) {
    params.set(PROPERTY_SEARCH_KEYS.operation, controls.operacion);
  }
  if (controls.ubicacion && controls.ubicacion !== "Todas") {
    params.set(PROPERTY_SEARCH_KEYS.location, controls.ubicacion);
  }
  if (controls.tipo && controls.tipo !== "Todos") {
    params.set(PROPERTY_SEARCH_KEYS.type, controls.tipo);
  }
  const typeUsesBedrooms =
    !controls.tipo ||
    controls.tipo === "Todos" ||
    propertyUsesBedrooms(controls.tipo);
  if (typeUsesBedrooms && controls.dormitorios && controls.dormitorios !== "Todos") {
    params.set(PROPERTY_SEARCH_KEYS.bedrooms, controls.dormitorios);
  }
  if (controls.cochera && controls.cochera !== "Todas") {
    params.set(PROPERTY_SEARCH_KEYS.garage, controls.cochera);
  }
  if (controls.superficieDesde) {
    params.set(PROPERTY_SEARCH_KEYS.surfaceMin, controls.superficieDesde);
  }
  if (controls.superficieHasta) {
    params.set(PROPERTY_SEARCH_KEYS.surfaceMax, controls.superficieHasta);
  }
  if (controls.precioDesde) {
    params.set(PROPERTY_SEARCH_KEYS.priceMin, controls.precioDesde);
  }
  if (controls.precioHasta) {
    params.set(PROPERTY_SEARCH_KEYS.priceMax, controls.precioHasta);
  }
  if (
    (controls.precioDesde || controls.precioHasta) &&
    (controls.moneda === "USD" || controls.moneda === "ARS")
  ) {
    params.set(PROPERTY_SEARCH_KEYS.currency, controls.moneda);
  }
  return parsePropertySearch(params);
}

export function toPropertySearchQuery(search: PropertySearch) {
  const params = new URLSearchParams();
  if (search.operation) {
    params.set(PROPERTY_SEARCH_KEYS.operation, search.operation);
  }
  if (search.location) {
    params.set(PROPERTY_SEARCH_KEYS.location, search.location);
  }
  if (search.type) {
    params.set(PROPERTY_SEARCH_KEYS.type, search.type);
  }
  if (search.currency) {
    params.set(PROPERTY_SEARCH_KEYS.currency, search.currency);
  }
  if (search.priceMin !== null) {
    params.set(PROPERTY_SEARCH_KEYS.priceMin, String(search.priceMin));
  }
  if (search.priceMax !== null) {
    params.set(PROPERTY_SEARCH_KEYS.priceMax, String(search.priceMax));
  }
  if (search.bedrooms) {
    params.set(PROPERTY_SEARCH_KEYS.bedrooms, search.bedrooms);
  }
  if (search.surfaceMin !== null) {
    params.set(PROPERTY_SEARCH_KEYS.surfaceMin, String(search.surfaceMin));
  }
  if (search.surfaceMax !== null) {
    params.set(PROPERTY_SEARCH_KEYS.surfaceMax, String(search.surfaceMax));
  }
  if (search.garage) {
    params.set(PROPERTY_SEARCH_KEYS.garage, search.garage);
  }
  return params.toString();
}

function matchesBedrooms(bedrooms: number, filter: BedroomFilter) {
  if (filter === "4+") {
    return bedrooms >= 4;
  }
  return bedrooms === Number(filter);
}

export function filterProperties(properties: Property[], search: PropertySearch) {
  const priceActive = search.priceMin !== null || search.priceMax !== null;

  return properties.filter((property) => {
    if (search.operation && property.operation !== search.operation) {
      return false;
    }
    if (search.location && property.location !== search.location) {
      return false;
    }
    if (search.type && property.type !== search.type) {
      return false;
    }
    if (search.bedrooms) {
      if (!propertyUsesBedrooms(property.type)) {
        return false;
      }
      if (!matchesBedrooms(property.bedrooms, search.bedrooms)) {
        return false;
      }
    }
    if (search.garage === "Sí" && !(property.garage && property.garage > 0)) {
      return false;
    }
    if (search.garage === "No" && property.garage && property.garage > 0) {
      return false;
    }
    if (search.surfaceMin !== null || search.surfaceMax !== null) {
      const surface = comparableSurface(property);
      if (surface === undefined) {
        return false;
      }
      if (search.surfaceMin !== null && surface < search.surfaceMin) {
        return false;
      }
      if (search.surfaceMax !== null && surface > search.surfaceMax) {
        return false;
      }
    }

    const currency = detectCurrency(property.price);
    const amount = priceAmount(property.price);
    if (priceActive) {
      if (!search.currency || currency !== search.currency || amount === null) {
        return false;
      }
      if (search.priceMin !== null && amount < search.priceMin) {
        return false;
      }
      if (search.priceMax !== null && amount > search.priceMax) {
        return false;
      }
    } else if (search.currency && currency !== null && currency !== search.currency) {
      return false;
    }

    return true;
  });
}
