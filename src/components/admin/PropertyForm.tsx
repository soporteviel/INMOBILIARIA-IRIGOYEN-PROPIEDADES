"use client";

import { savePropertyAction } from "@/app/admin/propiedades/actions";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  formatAdminDate,
  LOCATION_PRECISIONS,
  operationUsesPeriod,
  PERIOD_LABELS,
  PRECISION_LABELS,
  PRICE_PERIODS,
  PROPERTY_CURRENCIES,
  PROPERTY_OPERATIONS,
  PROPERTY_TYPES,
  typeUsesBedrooms,
  typeUsesInterior,
  type PropertyFormInput,
  type PropertyRecord,
  type PropertyStatus,
} from "@/lib/properties/model";
import { Alert, Button, Card, Form, Input, Select, Switch } from "antd";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";

type FormShape = {
  title?: string;
  propertyType?: string;
  operation?: string;
  location?: string;
  locationPrecision?: string;
  priceOnRequest?: boolean;
  price?: string;
  currency?: string;
  pricePeriod?: string;
  bedrooms?: string;
  bathrooms?: string;
  rooms?: string;
  garage?: string;
  coveredAreaM2?: string;
  totalAreaM2?: string;
  landAreaM2?: string;
  description?: string;
  features?: string[];
  featured?: boolean;
};

type Intent = "save" | "publish" | "pause";

function toInput(values: FormShape): PropertyFormInput {
  return {
    title: values.title ?? "",
    description: values.description ?? "",
    location: values.location ?? "",
    locationPrecision: values.locationPrecision ?? "",
    propertyType: values.propertyType ?? "",
    operation: values.operation ?? "",
    priceOnRequest: values.priceOnRequest === true,
    price: values.price ?? "",
    currency: values.currency ?? "",
    pricePeriod: values.pricePeriod ?? "",
    bedrooms: values.bedrooms ?? "",
    bathrooms: values.bathrooms ?? "",
    rooms: values.rooms ?? "",
    garage: values.garage ?? "",
    coveredAreaM2: values.coveredAreaM2 ?? "",
    totalAreaM2: values.totalAreaM2 ?? "",
    landAreaM2: values.landAreaM2 ?? "",
    features: values.features ?? [],
    featured: values.featured === true,
  };
}

const FORM_FIELDS = [
  "title",
  "propertyType",
  "operation",
  "location",
  "locationPrecision",
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
  "description",
  "features",
  "featured",
] as const satisfies readonly (keyof FormShape)[];

function FieldLabel({ text, hint }: { text: string; hint?: string }) {
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2">
      <span>{text}</span>
      {hint ? <span className="text-sm font-normal text-[#5c5854]">{hint}</span> : null}
    </span>
  );
}

function fieldIsVisible(name: (typeof FORM_FIELDS)[number], values: FormShape) {
  const type = PROPERTY_TYPES.find((item) => item === values.propertyType) ?? null;
  const operation = PROPERTY_OPERATIONS.find((item) => item === values.operation) ?? null;
  if (name === "bedrooms") {
    return type === null || typeUsesBedrooms(type);
  }
  if (name === "bathrooms" || name === "rooms" || name === "garage") {
    return type === null || typeUsesInterior(type);
  }
  if (name === "coveredAreaM2") {
    return type !== "Lote";
  }
  if (name === "pricePeriod") {
    return operationUsesPeriod(operation);
  }
  return true;
}

export function PropertyForm({
  property,
  initialValues,
  saved,
}: {
  property: PropertyRecord | null;
  initialValues: PropertyFormInput;
  saved: boolean;
}) {
  const [form] = Form.useForm<FormShape>();
  const [pending, startTransition] = useTransition();
  const [activeIntent, setActiveIntent] = useState<Intent | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverFieldErrors, setServerFieldErrors] = useState<string[]>([]);
  const intentRef = useRef<Intent>("save");
  const propertyType = Form.useWatch("propertyType", form) ?? initialValues.propertyType;
  const operation = Form.useWatch("operation", form) ?? initialValues.operation;
  const priceOnRequest = Form.useWatch("priceOnRequest", form) ?? initialValues.priceOnRequest;
  const typedType = PROPERTY_TYPES.find((type) => type === propertyType) ?? null;
  const typedOperation = PROPERTY_OPERATIONS.find((item) => item === operation) ?? null;
  const showInterior = typedType === null || typeUsesInterior(typedType);
  const showBedrooms = typedType === null || typeUsesBedrooms(typedType);
  const showCovered = typedType !== "Lote";
  const showPeriod = operationUsesPeriod(typedOperation);
  const status: PropertyStatus = property?.status ?? "BORRADOR";
  const saveLabel = !property || status === "BORRADOR" ? "Guardar borrador" : "Guardar cambios";

  function chooseIntent(intent: Intent) {
    intentRef.current = intent;
    if (intent !== "save") {
      form.submit();
    }
  }

  function showFailure(values: FormShape, message: string, fieldErrors: Record<string, string>) {
    const messages = Object.values(fieldErrors);
    form.setFields(
      FORM_FIELDS.map((name) => ({
        name,
        errors: fieldErrors[name] ? [fieldErrors[name]] : [],
      })),
    );
    setServerFieldErrors(messages);
    setFormError(message);
    setActiveIntent(null);
    const firstField = FORM_FIELDS.find((name) => fieldErrors[name] && fieldIsVisible(name, values));
    window.requestAnimationFrame(() => {
      if (firstField) {
        form.scrollToField(firstField, { block: "center", focus: true });
        return;
      }
      document.getElementById("form-error")?.focus();
    });
  }

  return (
    <Form
      form={form}
      layout="vertical"
      requiredMark={false}
      preserve
      initialValues={initialValues}
      scrollToFirstError={{ block: "center", focus: true }}
      aria-busy={pending}
      onFinishFailed={(info) => {
        setActiveIntent(null);
        setServerFieldErrors(info.errorFields.flatMap((field) => field.errors));
        setFormError("Revisá los campos marcados.");
      }}
      onFinish={(values) => {
        setActiveIntent(intentRef.current);
        setFormError(null);
        setServerFieldErrors([]);
        startTransition(async () => {
          const result = await savePropertyAction({
            id: property?.id ?? null,
            intent: intentRef.current,
            values: toInput(values),
          });
          showFailure(values, result?.message ?? "No se pudo guardar la propiedad.", result?.fieldErrors ?? {});
        });
      }}
    >
      <div className="mb-6">
        <Link
          href="/admin"
          className="text-[15px] text-[#155547] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155547]"
        >
          Volver a propiedades
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-medium tracking-normal text-[#2a2a2a]">
            {property ? property.title : "Nueva propiedad"}
          </h1>
          <StatusBadge status={status} />
        </div>
        <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-[#5c5854]">
          Podés guardar un borrador incompleto: alcanza con el título. Para publicar hacen falta ubicación, tipo,
          operación y precio.
        </p>
      </div>

      {saved && !formError ? (
        <Alert className="mb-4" type="success" message="Cambios guardados" />
      ) : null}
      {formError ? (
        <div id="form-error" tabIndex={-1} className="mb-4 rounded-lg outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9f2d2d]">
          <Alert
            type="error"
            message={formError}
            description={
              serverFieldErrors.length > 0 ? (
                <ul className="list-disc pl-4">
                  {serverFieldErrors.map((error, index) => (
                    <li key={`${error}-${index}`}>{error}</li>
                  ))}
                </ul>
              ) : null
            }
          />
        </div>
      ) : null}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="flex min-w-0 flex-col gap-4">
          <Card title="Información general">
            <Form.Item
              label={<FieldLabel text="Título" hint="Obligatorio" />}
              name="title"
              rules={[{ required: true, whitespace: true, message: "El título es obligatorio." }]}
            >
              <Input maxLength={160} placeholder="Ejemplo: Departamento de 3 ambientes" />
            </Form.Item>
            <div className="grid gap-x-4 sm:grid-cols-2">
              <Form.Item label={<FieldLabel text="Tipo de propiedad" hint="Para publicar" />} name="propertyType">
                <Select
                  allowClear
                  placeholder="Elegí un tipo"
                  options={PROPERTY_TYPES.map((type) => ({ value: type, label: type }))}
                />
              </Form.Item>
              <Form.Item label={<FieldLabel text="Operación" hint="Para publicar" />} name="operation">
                <Select
                  allowClear
                  placeholder="Venta, alquiler o temporal"
                  options={PROPERTY_OPERATIONS.map((item) => ({ value: item, label: item }))}
                />
              </Form.Item>
            </div>
          </Card>

          <Card title="Ubicación">
            <div className="grid gap-x-4 sm:grid-cols-2">
              <Form.Item
                label={<FieldLabel text="Ubicación" hint="Para publicar" />}
                name="location"
                extra="Barrio, localidad o dirección, como quieras mostrarla."
              >
                <Input maxLength={160} placeholder="Ejemplo: City Bell" />
              </Form.Item>
              <Form.Item
                label="Precisión de la ubicación"
                name="locationPrecision"
                extra="Si es aproximada, más adelante no se va a mostrar un punto exacto."
              >
                <Select
                  allowClear
                  placeholder="Sin especificar"
                  options={LOCATION_PRECISIONS.map((item) => ({ value: item, label: PRECISION_LABELS[item] }))}
                />
              </Form.Item>
            </div>
          </Card>

          <Card title="Precio">
            <Form.Item
              label="Consultar precio"
              name="priceOnRequest"
              valuePropName="checked"
              extra="Si lo activás, la ficha dice Consultar y no se usa el monto ni la moneda."
            >
              <Switch aria-label="Consultar precio" />
            </Form.Item>
            <div className="grid gap-x-4 sm:grid-cols-2 xl:grid-cols-3">
              <Form.Item
                label={<FieldLabel text="Precio" hint="Para publicar" />}
                name="price"
                extra="Mayor que cero. Podés usar coma para los centavos."
              >
                <Input
                  inputMode="decimal"
                  placeholder="Ejemplo: 168000"
                  disabled={priceOnRequest}
                  className="max-w-[14rem]"
                />
              </Form.Item>
              <Form.Item label="Moneda" name="currency">
                <Select
                  allowClear
                  disabled={priceOnRequest}
                  placeholder="ARS o USD"
                  className="max-w-[14rem]"
                  options={PROPERTY_CURRENCIES.map((currency) => ({
                    value: currency,
                    label: currency === "ARS" ? "Pesos (ARS)" : "Dólares (USD)",
                  }))}
                />
              </Form.Item>
              <Form.Item
                label={<FieldLabel text="Período del precio" hint={showPeriod && !priceOnRequest ? "Para publicar" : undefined} />}
                name="pricePeriod"
                hidden={!showPeriod}
                preserve
                extra={priceOnRequest ? "No se usa mientras el precio sea a consultar." : undefined}
              >
                <Select
                  allowClear
                  disabled={priceOnRequest}
                  placeholder="Elegí un período"
                  options={PRICE_PERIODS.map((item) => ({ value: item, label: PERIOD_LABELS[item] }))}
                />
              </Form.Item>
            </div>
          </Card>

          <Card title="Características y superficies">
            <p className="mb-4 text-[15px] text-[#5c5854]">Vacío significa que no lo sabés. Cero es un dato real.</p>
            <div className="grid gap-x-4 sm:grid-cols-2 xl:grid-cols-3">
              <Form.Item label="Dormitorios" name="bedrooms" hidden={!showBedrooms} preserve>
                <Input inputMode="numeric" className="max-w-[9.5rem]" />
              </Form.Item>
              <Form.Item label="Baños" name="bathrooms" hidden={!showInterior} preserve>
                <Input inputMode="numeric" className="max-w-[9.5rem]" />
              </Form.Item>
              <Form.Item label="Ambientes" name="rooms" hidden={!showInterior} preserve>
                <Input inputMode="numeric" className="max-w-[9.5rem]" />
              </Form.Item>
              <Form.Item
                label="Cocheras"
                name="garage"
                hidden={!showInterior}
                preserve
                extra="Cero significa que no tiene cochera."
              >
                <Input inputMode="numeric" className="max-w-[9.5rem]" />
              </Form.Item>
              <Form.Item label="Superficie cubierta" name="coveredAreaM2" hidden={!showCovered} preserve>
                <Input inputMode="decimal" suffix="m²" className="max-w-[12rem]" />
              </Form.Item>
              <Form.Item label="Superficie total" name="totalAreaM2">
                <Input inputMode="decimal" suffix="m²" className="max-w-[12rem]" />
              </Form.Item>
              <Form.Item label="Superficie del terreno" name="landAreaM2">
                <Input inputMode="decimal" suffix="m²" className="max-w-[12rem]" />
              </Form.Item>
            </div>
            {!showBedrooms && typedType ? (
              <p className="text-[15px] text-[#5c5854]">
                {typedType === "Lote"
                  ? "Un lote no usa dormitorios, baños, ambientes, cocheras ni superficie cubierta. Si cambiás el tipo, esos datos siguen en el formulario hasta que guardes."
                  : "Este tipo no usa dormitorios. Si cambiás el tipo, ese dato sigue en el formulario hasta que guardes."}
              </p>
            ) : null}
          </Card>

          <Card title="Descripción y adicionales">
            <Form.Item label="Descripción" name="description">
              <Input.TextArea rows={5} maxLength={8000} placeholder="Contá lo más importante de la propiedad." />
            </Form.Item>
            <Form.Item
              label="Características"
              name="features"
              extra="Escribí una y presioná Enter. Por ejemplo: pileta, patio, balcón."
            >
              <Select mode="tags" tokenSeparators={[","]} placeholder="Agregar característica" />
            </Form.Item>
          </Card>
        </div>

        <aside className="rounded-[10px] border border-[#e4e0d8] bg-white p-5 lg:sticky lg:top-6">
          <p className="text-sm text-[#5c5854]">Estado</p>
          <div className="mt-2">
            <StatusBadge status={status} />
          </div>
          <Form.Item
            className="mt-5 mb-0"
            label="Destacada"
            name="featured"
            valuePropName="checked"
            extra="Es independiente del estado."
          >
            <Switch aria-label="Destacada" disabled={pending} />
          </Form.Item>
          <div className="mt-5 flex flex-col gap-2">
            {status === "PUBLICADA" ? (
              <>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={pending && activeIntent === "save"}
                  disabled={pending}
                  onClick={() => chooseIntent("save")}
                >
                  {saveLabel}
                </Button>
                <Button
                  htmlType="button"
                  loading={pending && activeIntent === "pause"}
                  disabled={pending}
                  onClick={() => chooseIntent("pause")}
                >
                  Pausar
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="primary"
                  htmlType="button"
                  loading={pending && activeIntent === "publish"}
                  disabled={pending}
                  onClick={() => chooseIntent("publish")}
                >
                  {status === "PAUSADA" ? "Reactivar" : "Publicar"}
                </Button>
                <Button
                  htmlType="submit"
                  loading={pending && activeIntent === "save"}
                  disabled={pending}
                  onClick={() => chooseIntent("save")}
                >
                  {saveLabel}
                </Button>
              </>
            )}
          </div>
          {pending ? (
            <p className="mt-3 text-sm text-[#5c5854]" role="status">
              Guardando…
            </p>
          ) : null}
          {property ? (
            <p className="mt-4 text-sm leading-relaxed text-[#5c5854]">
              Identificador: {property.slug}. No cambia si editás el título. Última actualización:{" "}
              {formatAdminDate(property.updatedAt)}.
            </p>
          ) : null}
        </aside>
      </div>
    </Form>
  );
}
