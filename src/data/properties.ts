export type PropertyPhoto = {
  id: string;
  src: string;
  alt: string;
};

export type LocationPrecision = "exact" | "approximate";

export type Property = {
  id: string;
  slug: string;
  title: string;
  location: string;
  /** Preparado para una ficha futura. Sin coordenadas no se muestra un mapa. */
  locationPrecision?: LocationPrecision;
  type: string;
  operation: "Venta" | "Alquiler" | "Temporal";
  price: string;
  bedrooms: number;
  bathrooms: number;
  area: string;
  image: string;
  imageAlt: string;
  rooms?: number;
  /** Cantidad de cocheras. Ausente si no está informada. */
  garage?: number;
  coveredAreaM2?: number;
  totalAreaM2?: number;
  landAreaM2?: number;
  description?: string;
  features?: string[];
  photos: PropertyPhoto[];
};

function demoPhotos(
  id: string,
  src: string,
  alt: string,
  count: number,
): PropertyPhoto[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${id}-foto-${index + 1}`,
    src,
    alt: `${alt}, foto ${index + 1}`,
  }));
}

export const featuredProperties: Property[] = [
  {
    id: "demo-1",
    slug: "departamento-3-ambientes-city-bell",
    title: "Departamento de 3 ambientes",
    location: "City Bell",
    type: "Departamento",
    operation: "Venta",
    price: "USD 168.000",
    bedrooms: 2,
    bathrooms: 1,
    rooms: 3,
    coveredAreaM2: 72,
    area: "72 m²",
    image: "/images/propiedad-1.jpg",
    imageAlt: "Departamento de 3 ambientes",
    description:
      "Departamento de 3 ambientes en City Bell.\n\nTiene 2 dormitorios, 1 baño y 72 m² de superficie cubierta.",
    photos: demoPhotos(
      "demo-1",
      "/images/propiedad-1.jpg",
      "Departamento de 3 ambientes",
      20,
    ),
  },
  {
    id: "demo-2",
    slug: "casa-con-jardin-la-plata",
    title: "Casa con jardín",
    location: "La Plata",
    type: "Casa",
    operation: "Venta",
    price: "USD 245.000",
    bedrooms: 3,
    bathrooms: 2,
    coveredAreaM2: 180,
    area: "180 m²",
    image: "/images/propiedad-2.jpg",
    imageAlt: "Casa con jardín",
    description: "Casa en La Plata, con 3 dormitorios, 2 baños y 180 m² cubiertos.",
    photos: demoPhotos("demo-2", "/images/propiedad-2.jpg", "Casa con jardín", 4),
  },
  {
    id: "demo-3",
    slug: "ph-2-ambientes-gonnet",
    title: "PH de 2 ambientes",
    location: "Manuel B. Gonnet",
    type: "PH",
    operation: "Alquiler",
    price: "$ 420.000 / mes",
    bedrooms: 1,
    bathrooms: 1,
    rooms: 2,
    coveredAreaM2: 58,
    area: "58 m²",
    image: "/images/propiedad-3.jpg",
    imageAlt: "PH de 2 ambientes",
    description: "PH de 2 ambientes en Manuel B. Gonnet, con 1 dormitorio y 58 m² cubiertos.",
    photos: demoPhotos("demo-3", "/images/propiedad-3.jpg", "PH de 2 ambientes", 3),
  },
  {
    id: "demo-4",
    slug: "casa-4-ambientes-villa-elisa",
    title: "Casa de 4 ambientes",
    location: "Villa Elisa",
    type: "Casa",
    operation: "Venta",
    price: "USD 198.000",
    bedrooms: 3,
    bathrooms: 2,
    rooms: 4,
    coveredAreaM2: 145,
    area: "145 m²",
    image: "/images/propiedad-2.jpg",
    imageAlt: "Casa de 4 ambientes",
    photos: demoPhotos(
      "demo-4",
      "/images/propiedad-2.jpg",
      "Casa de 4 ambientes",
      2,
    ),
  },
  {
    id: "demo-5",
    slug: "departamento-2-ambientes-tolosa",
    title: "Departamento de 2 ambientes",
    location: "Tolosa",
    type: "Departamento",
    operation: "Alquiler",
    price: "$ 380.000 / mes",
    bedrooms: 1,
    bathrooms: 1,
    rooms: 2,
    coveredAreaM2: 52,
    area: "52 m²",
    image: "/images/propiedad-1.jpg",
    imageAlt: "Departamento de 2 ambientes",
    photos: demoPhotos(
      "demo-5",
      "/images/propiedad-1.jpg",
      "Departamento de 2 ambientes",
      1,
    ),
  },
  {
    id: "demo-6",
    slug: "local-planta-baja-ringuelet",
    title: "Local en planta baja",
    location: "Ringuelet",
    type: "Local",
    operation: "Venta",
    price: "0",
    bedrooms: 0,
    bathrooms: 1,
    coveredAreaM2: 48,
    area: "48 m²",
    image: "/images/propiedad-3.jpg",
    imageAlt: "Local en planta baja",
    description: "Local en planta baja en Ringuelet, con 48 m² cubiertos.",
    photos: demoPhotos(
      "demo-6",
      "/images/propiedad-3.jpg",
      "Local en planta baja",
      1,
    ),
  },
];

/** Fichas visibles. Este archivo no distingue borradores ni pausadas. */
export function getPublishedProperties() {
  return featuredProperties;
}

export function getPropertyBySlug(slug: string) {
  return getPublishedProperties().find((property) => property.slug === slug);
}

export function getOtherProperties(slug: string, limit = 3) {
  return getPublishedProperties()
    .filter((property) => property.slug !== slug)
    .slice(0, limit);
}

export function detailPrice(price: string) {
  const digits = price.replace(/\D/g, "");
  if (!price.trim() || !digits || Number(digits) === 0) {
    return "Consultar precio";
  }
  return price;
}

export function formatSquareMeters(value: number) {
  return `${new Intl.NumberFormat("es-AR").format(value)} m²`;
}

const OPERATION_ORDER = ["Venta", "Alquiler", "Temporal"] as const;
const TYPES_WITH_BEDROOMS = new Set(["Casa", "Departamento", "PH"]);
const TYPES_WITH_LAND_AREA = new Set(["Lote"]);

export function detectCurrency(price: string): "USD" | "ARS" | null {
  const trimmed = price.trim();
  if (!trimmed || trimmed === "0") {
    return null;
  }
  if (/^USD/i.test(trimmed) || /US\$/i.test(trimmed)) {
    return "USD";
  }
  if (/^\$/.test(trimmed) || /^ARS/i.test(trimmed)) {
    return "ARS";
  }
  return null;
}

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
  return Array.from(new Set(values)).sort((a, b) =>
    a.localeCompare(b, "es-AR"),
  );
}

export function getPropertyFilterOptions(
  properties: Property[] = getPublishedProperties(),
) {
  const operations = OPERATION_ORDER.filter((operation) =>
    properties.some((property) => property.operation === operation),
  );
  const types = uniqueSorted(properties.map((property) => property.type));
  const locations = uniqueSorted(
    properties.map((property) => property.location),
  );
  const currencies = (["USD", "ARS"] as const).filter((currency) =>
    properties.some((property) => detectCurrency(property.price) === currency),
  );
  const showBedrooms = properties.some((property) =>
    propertyUsesBedrooms(property.type),
  );

  return {
    operations,
    types: ["Todos", ...types],
    locations: ["Todas", ...locations],
    currencies,
    bedrooms: ["Todos", "1", "2", "3", "4+"] as const,
    showBedrooms,
    garage: ["Todas", "Sí", "No"] as const,
  };
}

/** @deprecated usar getPropertyFilterOptions */
export const propertyFilterOptions = getPropertyFilterOptions();
