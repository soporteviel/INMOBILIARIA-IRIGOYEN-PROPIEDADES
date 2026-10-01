"use client";

import { useState, type FormEvent } from "react";
import { whatsappLink } from "@/config/site";
import {
  emptyValuationForm,
  formatValuationMessage,
  valuationGarage,
  valuationOperations,
  valuationPropertyTypes,
  valuationRooms,
  type ValuationFormValues,
} from "@/data/valuation";
import { ChoiceGroup, TextArea, TextInput } from "@/components/FormFields";

type FormErrors = Partial<Record<keyof ValuationFormValues, string>>;

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function validate(values: ValuationFormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.fullName.trim()) {
    errors.fullName = "Completá tu nombre y apellido.";
  }
  if (!values.email.trim()) {
    errors.email = "Completá tu email.";
  } else if (!isValidEmail(values.email)) {
    errors.email = "Revisá que el email esté bien escrito.";
  }
  if (!values.phone.trim()) {
    errors.phone = "Completá tu teléfono.";
  }
  if (!values.operation) {
    errors.operation = "Elegí el tipo de operación.";
  }
  if (!values.propertyType) {
    errors.propertyType = "Elegí el tipo de propiedad.";
  }

  return errors;
}

function buildWhatsapp(values: ValuationFormValues) {
  return whatsappLink(formatValuationMessage(values));
}

export function ValuationForm() {
  const [values, setValues] = useState<ValuationFormValues>(emptyValuationForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function update<K extends keyof ValuationFormValues>(
    key: K,
    value: ValuationFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const whatsapp = buildWhatsapp(values);
    if (!whatsapp) {
      setSubmitError("No se pudo abrir WhatsApp. Escribinos desde el botón de contacto.");
      return;
    }

    setSubmitError(null);
    window.open(whatsapp, "_blank", "noopener,noreferrer");
    setSent(true);
  }

  if (sent) {
    return (
      <div className="border border-linea bg-papel px-6 py-10 text-center sm:px-10">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-verde">
          Consulta lista
        </p>
        <h3 className="mt-3 font-serif text-2xl text-verde-profundo">
          Gracias, {values.fullName.trim().split(" ")[0] || ""}
        </h3>
        <button
          type="button"
          className="mt-8 inline-flex min-h-12 items-center justify-center bg-verde px-6 text-sm font-medium tracking-wide text-papel transition-colors hover:bg-verde-medio"
          onClick={() => {
            setValues(emptyValuationForm);
            setSent(false);
          }}
        >
          Cargar otra consulta
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="border border-linea bg-papel px-5 py-5 sm:px-6 sm:py-6"
    >
      <div className="grid gap-8 lg:grid-cols-3 lg:gap-0 lg:divide-x lg:divide-linea">
        <section className="lg:pr-6">
          <h3 className="border-b border-linea pb-2 font-serif text-xl text-verde-profundo">
            Datos personales
          </h3>
          <div className="mt-4 grid gap-3">
            <TextInput
              id="fullName"
              label="Nombre y apellido:"
              placeholder="Nombre y apellido"
              value={values.fullName}
              autoComplete="name"
              required
              error={errors.fullName}
              onChange={(value) => update("fullName", value)}
            />
            <TextInput
              id="email"
              label="Email:"
              type="email"
              placeholder="Email"
              value={values.email}
              autoComplete="email"
              required
              error={errors.email}
              onChange={(value) => update("email", value)}
            />
            <TextInput
              id="phone"
              label="Teléfono:"
              type="tel"
              placeholder="Teléfono"
              value={values.phone}
              autoComplete="tel"
              required
              error={errors.phone}
              onChange={(value) => update("phone", value)}
            />
            <TextInput
              id="contactHours"
              label="Horario de contacto:"
              placeholder="Horario"
              value={values.contactHours}
              onChange={(value) => update("contactHours", value)}
            />
            <TextInput
              id="address"
              label="Dirección:"
              placeholder="Dirección"
              value={values.address}
              autoComplete="street-address"
              onChange={(value) => update("address", value)}
            />
          </div>
        </section>

        <section className="lg:px-6">
          <h3 className="border-b border-linea pb-2 font-serif text-xl text-verde-profundo">
            Datos del inmueble
          </h3>
          <div className="mt-4 grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <ChoiceGroup
                legend="Operación:"
                name="operation"
                value={values.operation}
                options={valuationOperations}
                error={errors.operation}
                onChange={(value) => update("operation", value)}
              />
              <ChoiceGroup
                legend="Garage:"
                name="garage"
                value={values.garage}
                options={valuationGarage}
                onChange={(value) => update("garage", value)}
              />
            </div>
            <ChoiceGroup
              legend="Tipo de propiedad:"
              name="propertyType"
              value={values.propertyType}
              options={valuationPropertyTypes}
              error={errors.propertyType}
              onChange={(value) => update("propertyType", value)}
            />
            <ChoiceGroup
              legend="Ambientes:"
              name="rooms"
              value={values.rooms}
              options={valuationRooms}
              columns={4}
              onChange={(value) => update("rooms", value)}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <TextInput
                id="coveredArea"
                label="Sup. cubierta:"
                type="number"
                placeholder="0"
                suffix="m²"
                value={values.coveredArea}
                onChange={(value) => update("coveredArea", value)}
              />
              <TextInput
                id="totalArea"
                label="Sup. total:"
                type="number"
                placeholder="0"
                suffix="m²"
                value={values.totalArea}
                onChange={(value) => update("totalArea", value)}
              />
            </div>
          </div>
        </section>

        <section className="lg:pl-6">
          <h3 className="border-b border-linea pb-2 font-serif text-xl text-verde-profundo">
            Adicionales
          </h3>
          <div className="mt-4 grid gap-3">
            <TextArea
              id="amenities"
              label="¿Qué amenities tiene?"
              placeholder="Pileta, SUM, laundry, parrilla…"
              rows={3}
              value={values.amenities}
              onChange={(value) => update("amenities", value)}
            />
            <TextArea
              id="notes"
              label="Observaciones"
              placeholder="Observaciones"
              rows={3}
              value={values.notes}
              onChange={(value) => update("notes", value)}
            />
            {submitError ? <p className="text-sm text-[#9f2d2d]">{submitError}</p> : null}
            <button
              type="submit"
              className="inline-flex min-h-10 w-full cursor-pointer items-center justify-center bg-verde px-5 text-sm font-medium tracking-wide text-papel transition-colors hover:bg-verde-medio focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde-profundo"
            >
              Enviar por WhatsApp
            </button>
          </div>
        </section>
      </div>
    </form>
  );
}
