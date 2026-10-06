export type PropertyPhoto = {
  id: string;
  src: string;
  alt: string;
};

export type LocationPrecision = "exact" | "approximate";
export type PropertyCurrency = "USD" | "ARS";
export type PropertyPricePeriod = "mes" | "semana" | "dia" | "temporada";

export type Property = {
  id: string;
  slug: string;
  title: string;
  location: string;
  locationPrecision?: LocationPrecision;
  type: string;
  operation: string;
  /** Importe numérico. null es desconocido y no equivale a cero. */
  price: number | null;
  currency: PropertyCurrency | null;
  priceOnRequest: boolean;
  pricePeriod: PropertyPricePeriod | null;
  /** null es desconocido y no equivale a cero. */
  bedrooms: number | null;
  bathrooms: number | null;
  area: string;
  /** null cuando la ficha no tiene una foto lista. */
  image: string | null;
  imageAlt: string;
  rooms: number | null;
  garage: number | null;
  coveredAreaM2: number | null;
  totalAreaM2: number | null;
  landAreaM2: number | null;
  description?: string;
  features?: string[];
  photos: PropertyPhoto[];
  featured: boolean;
};

export function formatSquareMeters(value: number) {
  return `${new Intl.NumberFormat("es-AR").format(value)} m²`;
}

export function formatPublicPrice(
  property: Pick<Property, "price" | "currency" | "priceOnRequest" | "pricePeriod" | "operation">,
  variant: "card" | "detail",
) {
  if (property.priceOnRequest) {
    return variant === "detail" ? "Consultar precio" : "Consultar";
  }
  if (property.price === null || !property.currency) {
    return "Sin precio";
  }
  const amount = new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: Number.isInteger(property.price) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(property.price);
  const money = property.currency === "USD" ? `USD ${amount}` : `$ ${amount}`;
  if (
    property.pricePeriod &&
    (property.operation === "Alquiler" || property.operation === "Temporal")
  ) {
    const period = property.pricePeriod === "dia" ? "día" : property.pricePeriod;
    return `${money} / ${period}`;
  }
  return money;
}

const TYPES_WITH_LAND_AREA = new Set(["Lote/Terreno", "Campo", "Lote", "Terreno"]);

export function cardSurface(property: Pick<Property, "type" | "coveredAreaM2" | "landAreaM2">) {
  const value = TYPES_WITH_LAND_AREA.has(property.type) ? property.landAreaM2 : property.coveredAreaM2;
  if (value === null) {
    return "—";
  }
  return formatSquareMeters(value);
}

export function countOrDash(value: number | null) {
  return value === null ? "—" : String(value);
}

const OPERATION_ORDER = ["Venta", "Alquiler", "Temporal"] as const;
const TYPES_WITH_BEDROOMS = new Set(["Casa", "Departamento", "PH"]);

export function propertyUsesBedrooms(type: string) {
  return TYPES_WITH_BEDROOMS.has(type);
}

export function surfaceLabelForType(type: string) {
  if (TYPES_WITH_LAND_AREA.has(type)) {
    return "Superficie del terreno";
  }
  return "Superficie cubierta";
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b, "es-AR"));
}

export type PropertyFilterOptions = {
  operations: string[];
  types: string[];
  locations: string[];
  currencies: PropertyCurrency[];
  bedrooms: readonly ["Todos", "1", "2", "3", "4+"];
  showBedrooms: boolean;
  garage: readonly ["Todas", "Sí", "No"];
};

export function getPropertyFilterOptions(properties: Property[]): PropertyFilterOptions {
  const operations = OPERATION_ORDER.filter((operation) =>
    properties.some((property) => property.operation === operation),
  );
  const currencies = (["USD", "ARS"] as const).filter((currency) =>
    properties.some(
      (property) =>
        !property.priceOnRequest &&
        property.price !== null &&
        property.currency === currency,
    ),
  );

  return {
    operations: [...operations],
    types: ["Todos", ...uniqueSorted(properties.map((property) => property.type))],
    locations: ["Todas", ...uniqueSorted(properties.map((property) => property.location))],
    currencies: [...currencies],
    bedrooms: ["Todos", "1", "2", "3", "4+"],
    showBedrooms: properties.some((property) => propertyUsesBedrooms(property.type)),
    garage: ["Todas", "Sí", "No"],
  };
}

export function emptyPropertyFilterOptions(): PropertyFilterOptions {
  return getPropertyFilterOptions([]);
}
