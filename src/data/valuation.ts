export const valuationOperations = [
  { value: "venta", label: "Venta" },
  { value: "alquiler", label: "Alquiler" },
] as const;

export const valuationPropertyTypes = [
  { value: "casa", label: "Casa" },
  { value: "departamento", label: "Departamento" },
  { value: "ph", label: "PH" },
  { value: "local", label: "Local" },
] as const;

export const valuationRooms = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4+", label: "4+" },
] as const;

export const valuationGarage = [
  { value: "si", label: "Sí" },
  { value: "no", label: "No" },
] as const;

export type ValuationFormValues = {
  fullName: string;
  email: string;
  phone: string;
  contactHours: string;
  address: string;
  operation: string;
  propertyType: string;
  rooms: string;
  coveredArea: string;
  totalArea: string;
  garage: string;
  amenities: string;
  notes: string;
  sendCopy: boolean;
};

export const emptyValuationForm: ValuationFormValues = {
  fullName: "",
  email: "",
  phone: "",
  contactHours: "",
  address: "",
  operation: "",
  propertyType: "",
  rooms: "",
  coveredArea: "",
  totalArea: "",
  garage: "",
  amenities: "",
  notes: "",
  sendCopy: false,
};

export function formatValuationMessage(values: ValuationFormValues) {
  const line = (label: string, value: string) =>
    `${label}: ${value.trim() || "—"}`;

  return [
    "Consulta de tasación",
    "",
    "Datos personales",
    line("Nombre y apellido", values.fullName),
    line("Email", values.email),
    line("Teléfono", values.phone),
    line("Horario de contacto", values.contactHours),
    line("Dirección", values.address),
    "",
    "Datos del inmueble",
    line("Operación", values.operation),
    line("Tipo de propiedad", values.propertyType),
    line("Ambientes", values.rooms),
    line("Sup. cubierta", values.coveredArea ? `${values.coveredArea} m²` : ""),
    line("Sup. total", values.totalArea ? `${values.totalArea} m²` : ""),
    line("Garage", values.garage),
    "",
    "Adicionales",
    line("Amenities", values.amenities),
    line("Observaciones", values.notes),
    "",
    values.sendCopy
      ? "Pidió recibir una copia de esta consulta por mail."
      : "No pidió copia por mail.",
  ].join("\n");
}
