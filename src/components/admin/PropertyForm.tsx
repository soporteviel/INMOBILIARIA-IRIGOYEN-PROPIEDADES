"use client";

import { PropertyPhotos, type PhotoSummary, type PropertyPhotosHandle } from "@/components/admin/PropertyPhotos";
import { IconArrowLeft, IconPlus } from "@/components/admin/icons";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { devEvent, devTiming } from "@/lib/dev/timing";
import { collapseLocation, foldLocation } from "@/lib/properties/locations";
import {
  operationUsesPeriod,
  PERIOD_LABELS,
  PRICE_PERIODS,
  PROPERTY_CURRENCIES,
  PROPERTY_OPERATIONS,
  PROPERTY_TYPES,
  typeIsLand,
  typeUsesBedrooms,
  typeUsesInterior,
  type PropertyFormInput,
  type PropertyRecord,
  type PropertyStatus,
} from "@/lib/properties/model";
import { normalizeProperty } from "@/lib/properties/validation";
import { site } from "@/config/site";
import { Alert, Button, Card, ConfigProvider, Form, Input, Modal, Select, Switch } from "antd";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";

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

function LocationSelect({
  locations,
  loading,
  onOpen,
  value,
  onChange,
}: {
  locations: string[];
  loading: boolean;
  onOpen: () => void;
  value?: string;
  onChange?: (value: string) => void;
}) {
  const [search, setSearch] = useState("");
  const collapsed = collapseLocation(search);
  const folded = foldLocation(collapsed);
  const visible = collapsed
    ? locations.filter((name) => foldLocation(name).includes(folded))
    : locations;
  const hasEquivalent = Boolean(collapsed) && locations.some((name) => foldLocation(name) === folded);
  const options = visible.map((name) => ({ value: name, label: name }));
  if (collapsed && !hasEquivalent) {
    options.push({
      value: collapsed,
      label: `Usar nueva ubicación: ${collapsed}`,
    });
  }

  return (
    <Select
      showSearch
      allowClear
      filterOption={false}
      value={value || undefined}
      placeholder="Buscá una ubicación o escribí una nueva"
      options={options}
      onSearch={setSearch}
      onChange={(next) => onChange?.(typeof next === "string" ? next : "")}
      onOpenChange={(open) => {
        if (open) {
          onOpen();
        }
        if (!open) {
          setSearch("");
        }
      }}
      notFoundContent={loading ? "Cargando ubicaciones…" : "Escribí el nombre para agregarlo."}
      aria-label="Ubicación"
    />
  );
}

function BoundedThumb({ url }: { url: string }) {
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const phaseRef = useRef<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (phaseRef.current !== "loading") {
        return;
      }
      phaseRef.current = "error";
      setPhase("error");
      devEvent("miniatura", "cancelada", "timeout");
    }, 15000);
    return () => window.clearTimeout(timeout);
  }, [url]);

  if (!url || phase === "error") {
    return <span className="flex h-full w-full items-center justify-center text-[10px] text-[#9f2d2d]">Error</span>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      className={`h-full w-full object-cover${phase === "ready" ? "" : " opacity-0"}`}
      onLoad={() => {
        phaseRef.current = "ready";
        setPhase("ready");
      }}
      onError={() => {
        phaseRef.current = "error";
        setPhase("error");
        devEvent("miniatura", "error");
      }}
    />
  );
}

function SavingStatus({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center text-center" role="status">
      <Image
        src={site.logo.src}
        alt=""
        width={site.logo.width}
        height={site.logo.height}
        sizes="104px"
        className="h-auto w-24 object-contain"
      />
      <span
        className="mt-6 inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#e4e0d8] border-t-[#155547]"
        aria-hidden="true"
      />
      <p className="mt-4 text-sm text-[#2a2a2a]">{message}</p>
    </div>
  );
}

function SectionButton({
  label,
  onClick,
}: {
  label: "Agregar" | "Editar";
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  const add = label === "Agregar";
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        add
          ? "inline-flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-full px-3 text-sm font-medium text-white transition-colors hover:bg-[#0c332e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155547]"
          : "inline-flex h-8 shrink-0 cursor-pointer items-center rounded-full border border-[#d5e4dc] bg-[#f3f8f5] px-3 text-sm font-medium text-[#155547] transition-colors hover:border-[#155547] hover:bg-[#e7f2ee] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155547]"
      }
      style={add ? { backgroundColor: "#155547", color: "#ffffff" } : undefined}
    >
      {add ? <IconPlus /> : null}
      {label}
    </button>
  );
}

function FieldLabel({ text, required }: { text: string; required?: boolean }) {
  return (
    <span>
      {text}
      {required ? (
        <span className="text-[#9f2d2d]" aria-hidden="true">
          {" "}
          *
        </span>
      ) : null}
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
    return !typeIsLand(type);
  }
  if (name === "pricePeriod") {
    return operationUsesPeriod(operation);
  }
  if (name === "locationPrecision") {
    return false;
  }
  return true;
}

type SaveResponse =
  | { ok: true; id: string }
  | { ok: false; message: string; fieldErrors: Record<string, string> };

async function postSave(body: { id: string | null; intent: Intent; values: PropertyFormInput; deferPublic?: boolean }) {
  const started = performance.now();
  const response = await fetch("/api/admin/propiedades", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = (await response.json().catch(() => null)) as SaveResponse | null;
  devTiming("guardar", "respuesta-cliente", started, body.intent);
  if (!result || typeof result.ok !== "boolean") {
    return { ok: false as const, message: "No se pudo guardar.", fieldErrors: {} };
  }
  return result;
}
const NEW_PROPERTY_DRAFT_KEY = "nip-new-property-draft";
const PROPERTY_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const cardStyles = {
  body: { padding: "12px 16px 4px" },
  header: { minHeight: 44, padding: "0 16px" },
};

function saveNotice(intent: Intent, property: PropertyRecord | null, status: PropertyStatus) {
  if (intent === "pause") {
    return "pausada";
  }
  if (intent === "publish") {
    return status === "PAUSADA" ? "reactivada" : "publicada";
  }
  return property ? "guardada" : "creada";
}

function PropertyActions({
  status,
  saveLabel,
  busy,
  activeIntent,
  onIntent,
  stacked,
}: {
  status: PropertyStatus;
  saveLabel: string;
  busy: boolean;
  activeIntent: Intent | null;
  onIntent: (intent: Intent, event: MouseEvent<HTMLElement>) => void;
  stacked: boolean;
}) {
  const layout = stacked ? "flex flex-col gap-2" : "flex gap-2";
  const buttonClass = stacked ? undefined : "min-w-0 flex-1";
  if (status === "PUBLICADA") {
    return (
      <div className={layout}>
        <Button
          type="primary"
          htmlType="submit"
          block={stacked}
          className={buttonClass}
          loading={busy && activeIntent === "save"}
          disabled={busy}
          onClick={(event) => onIntent("save", event)}
        >
          {saveLabel}
        </Button>
        <Button
          htmlType="button"
          block={stacked}
          className={buttonClass}
          loading={busy && activeIntent === "pause"}
          disabled={busy}
          onClick={(event) => onIntent("pause", event)}
        >
          Pausar
        </Button>
      </div>
    );
  }

  return (
    <div className={layout}>
      <Button
        type="primary"
        htmlType="button"
        block={stacked}
        className={buttonClass}
        loading={busy && activeIntent === "publish"}
        disabled={busy}
        onClick={(event) => onIntent("publish", event)}
      >
        {status === "PAUSADA" ? "Reactivar" : "Publicar"}
      </Button>
      <Button
        htmlType="submit"
        block={stacked}
        className={buttonClass}
        loading={busy && activeIntent === "save"}
        disabled={busy}
        onClick={(event) => onIntent("save", event)}
      >
        {saveLabel}
      </Button>
    </div>
  );
}

export function PropertyForm({
  property,
  initialValues,
}: {
  property: PropertyRecord | null;
  initialValues: PropertyFormInput;
}) {
  const router = useRouter();
  const [form] = Form.useForm<FormShape>();
  const [locked, setLocked] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [listingNote, setListingNote] = useState<string | null>(null);
  const [activeIntent, setActiveIntent] = useState<Intent | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverFieldErrors, setServerFieldErrors] = useState<string[]>([]);
  const [fieldErrorMap, setFieldErrorMap] = useState<Record<string, string>>({});
  const [snapshot, setSnapshot] = useState<FormShape>(initialValues);
  const [dirty, setDirty] = useState(false);
  const intentRef = useRef<Intent>("save");
  const submittingRef = useRef(false);
  const bypassLeaveRef = useRef(false);
  const draftIdRef = useRef<string | null>(property?.id ?? null);
  const [photoPropertyId, setPhotoPropertyId] = useState<string | null>(property?.id ?? null);
  const photosRef = useRef<PropertyPhotosHandle>(null);
  const [photoSummary, setPhotoSummary] = useState<PhotoSummary>({
    total: 0,
    pending: false,
    coverUrl: null,
    thumbs: [],
    message: null,
    load: "idle",
  });
  const [traitsOpen, setTraitsOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [traitDraft, setTraitDraft] = useState<FormShape>({});
  const [copyDraft, setCopyDraft] = useState<{ description: string; features: string[] }>({ description: "", features: [] });
  const [tagText, setTagText] = useState("");
  const traitsFocus = useRef<HTMLElement | null>(null);
  const copyFocus = useRef<HTMLElement | null>(null);
  const redirectedRef = useRef(false);
  const locationsRequested = useRef(false);
  const [locationNames, setLocationNames] = useState<string[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const propertyType = Form.useWatch("propertyType", form) ?? initialValues.propertyType;
  const operation = Form.useWatch("operation", form) ?? initialValues.operation;
  const priceOnRequest = Form.useWatch("priceOnRequest", form) ?? initialValues.priceOnRequest;
  const typedType = PROPERTY_TYPES.find((type) => type === propertyType) ?? null;
  const typedOperation = PROPERTY_OPERATIONS.find((item) => item === operation) ?? null;
  const showInterior = typedType === null || typeUsesInterior(typedType);
  const showBedrooms = typedType === null || typeUsesBedrooms(typedType);
  const showCovered = !typeIsLand(typedType);
  const showPeriod = operationUsesPeriod(typedOperation);
  const status: PropertyStatus = property?.status ?? "BORRADOR";
  const saveLabel = !property || status === "BORRADOR" ? "Guardar borrador" : "Guardar cambios";
  const busy = locked || leaving;

  useEffect(() => {
    devEvent("guardar-modal", progress === null ? "off" : "on", progress ?? undefined);
  }, [progress]);

  function loadLocations() {
    if (locationsRequested.current) {
      return;
    }
    locationsRequested.current = true;
    setLocationsLoading(true);
    const started = performance.now();
    void fetch("/api/admin/ubicaciones")
      .then(async (response) => {
        const body = (await response.json().catch(() => null)) as { names?: unknown } | null;
        if (response.ok && body && Array.isArray(body.names)) {
          setLocationNames(body.names.filter((name): name is string => typeof name === "string"));
        }
      })
      .finally(() => {
        devTiming("ubicaciones", "respuesta-cliente", started);
        setLocationsLoading(false);
      });
  }

  function openListing(intent: Intent) {
    window.sessionStorage.removeItem(NEW_PROPERTY_DRAFT_KEY);
    bypassLeaveRef.current = true;
    setProgress(null);
    setLocked(false);
    setActiveIntent(null);
    setLeaving(true);
    setListingNote("Abriendo el listado…");
    submittingRef.current = true;
    const started = performance.now();
    try {
      router.push(`/admin?aviso=${saveNotice(intent, property, status)}`);
      devTiming("navegacion-listado", "push-disparado", started);
    } catch {
      setLeaving(false);
      setListingNote(null);
      submittingRef.current = false;
      setFormError("La propiedad ya quedó guardada. No se pudo abrir el listado.");
    }
  }

  async function preparePhotoProperty() {
    const existing = property?.id ?? draftIdRef.current;
    if (existing) {
      return existing;
    }
    const title = String(form.getFieldValue("title") ?? "").trim();
    if (!title) {
      return null;
    }
    const result = await postSave({
      id: null,
      intent: "save",
      values: toInput(form.getFieldsValue()),
    });
    if (!result.ok) {
      return null;
    }
    draftIdRef.current = result.id;
    setPhotoPropertyId(result.id);
    window.sessionStorage.setItem(NEW_PROPERTY_DRAFT_KEY, result.id);
    return result.id;
  }

  function unlock() {
    submittingRef.current = false;
    setLocked(false);
    setActiveIntent(null);
    setProgress(null);
  }

  function chooseIntent(intent: Intent, event: MouseEvent<HTMLElement>) {
    event.preventDefault();
    if (submittingRef.current) {
      return;
    }
    submittingRef.current = true;
    devEvent("guardar", "inicio", intent);
    setLocked(true);
    setActiveIntent(intent);
    intentRef.current = intent;
    setProgress(intent === "publish" ? "Publicando…" : intent === "pause" ? "Pausando…" : "Guardando…");
    form.submit();
  }

  function showFailure(values: FormShape, message: string, fieldErrors: Record<string, string>) {
    const messages = Object.values(fieldErrors);
    setFieldErrorMap(fieldErrors);
    setServerFieldErrors(messages);
    setFormError(message);
    unlock();
    const firstField = FORM_FIELDS.find((name) => fieldErrors[name] && fieldIsVisible(name, values));
    window.requestAnimationFrame(() => {
      if (firstField) {
        form.scrollToField(firstField, { block: "center", focus: true });
        return;
      }
      document.getElementById("form-error")?.focus();
    });
  }

  useEffect(() => {
    if (redirectedRef.current) {
      return;
    }
    redirectedRef.current = true;
    if (property) {
      const stored = window.sessionStorage.getItem(NEW_PROPERTY_DRAFT_KEY);
      if (stored === property.id) {
        window.sessionStorage.removeItem(NEW_PROPERTY_DRAFT_KEY);
      }
      return;
    }
    const stored = window.sessionStorage.getItem(NEW_PROPERTY_DRAFT_KEY);
    if (!stored || !PROPERTY_ID_RE.test(stored)) {
      return;
    }
    bypassLeaveRef.current = true;
    router.replace(`/admin/propiedades/${stored}`);
  }, [property, router]);

  useEffect(() => {
    function onLeave(event: BeforeUnloadEvent) {
      if (bypassLeaveRef.current) {
        return;
      }
      const unsavedPhotos = photosRef.current?.hasUnsaved() ?? false;
      if (!dirty && !unsavedPhotos) {
        return;
      }
      event.preventDefault();
    }
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  function confirmLeave(event: MouseEvent<HTMLAnchorElement>) {
    if (bypassLeaveRef.current) {
      return;
    }
    const unsavedPhotos = photosRef.current?.hasUnsaved() ?? false;
    if (!dirty && !unsavedPhotos) {
      return;
    }
    if (!window.confirm("Hay datos o fotos sin guardar. ¿Querés salir igual?")) {
      event.preventDefault();
    }
  }

  const photosDirty = photoSummary.pending;

  function openTraits(event: MouseEvent<HTMLElement>) {
    traitsFocus.current = event.currentTarget;
    setTraitDraft(form.getFieldsValue());
    setTraitsOpen(true);
  }

  function applyTraits() {
    form.setFieldsValue({
      bedrooms: showBedrooms ? (traitDraft.bedrooms ?? "") : "",
      bathrooms: showInterior ? (traitDraft.bathrooms ?? "") : "",
      rooms: showInterior ? (traitDraft.rooms ?? "") : "",
      garage: showInterior ? (traitDraft.garage ?? "") : "",
      coveredAreaM2: showCovered ? (traitDraft.coveredAreaM2 ?? "") : "",
      totalAreaM2: traitDraft.totalAreaM2 ?? "",
      landAreaM2: traitDraft.landAreaM2 ?? "",
    });
    setFieldErrorMap((current) => {
      const next = { ...current };
      for (const name of ["bedrooms", "bathrooms", "rooms", "garage", "coveredAreaM2", "totalAreaM2", "landAreaM2"]) {
        delete next[name];
      }
      return next;
    });
    setSnapshot(form.getFieldsValue());
    setDirty(true);
    setTraitsOpen(false);
  }

  function closeTraits() {
    const current = form.getFieldsValue();
    const changed = ["bedrooms", "bathrooms", "rooms", "garage", "coveredAreaM2", "totalAreaM2", "landAreaM2"].some(
      (key) => (traitDraft[key as keyof FormShape] ?? "") !== (current[key as keyof FormShape] ?? ""),
    );
    if (!changed) {
      setTraitsOpen(false);
      return;
    }
    if (window.confirm("Se pierden los cambios de esta sección. El resto del formulario queda igual.")) {
      setTraitsOpen(false);
    }
  }

  function openCopy(event: MouseEvent<HTMLElement>) {
    copyFocus.current = event.currentTarget;
    const values = form.getFieldsValue();
    setCopyDraft({ description: values.description ?? "", features: values.features ?? [] });
    setTagText("");
    setCopyOpen(true);
  }

  function addTag() {
    const next = tagText.trim().slice(0, 80);
    if (!next) {
      return;
    }
    setCopyDraft((current) => {
      if (current.features.some((feature) => feature.localeCompare(next, "es", { sensitivity: "accent" }) === 0)) {
        return current;
      }
      return { ...current, features: [...current.features, next].slice(0, 40) };
    });
    setTagText("");
  }

  function applyCopy() {
    form.setFieldsValue({ description: copyDraft.description, features: copyDraft.features });
    setFieldErrorMap((current) => {
      const next = { ...current };
      delete next.description;
      delete next.features;
      return next;
    });
    setSnapshot(form.getFieldsValue());
    setDirty(true);
    setCopyOpen(false);
  }

  function closeCopy() {
    const values = form.getFieldsValue();
    const sameText = (values.description ?? "") === copyDraft.description;
    const sameTags = (values.features ?? []).join("|") === copyDraft.features.join("|");
    if (sameText && sameTags) {
      setCopyOpen(false);
      return;
    }
    if (window.confirm("Se pierden los cambios de esta sección. El resto del formulario queda igual.")) {
      setCopyOpen(false);
    }
  }

  const traitBits = [
    showBedrooms && snapshot.bedrooms?.trim() ? `${snapshot.bedrooms.trim()} dormitorios` : "",
    showInterior && snapshot.bathrooms?.trim() ? `${snapshot.bathrooms.trim()} baños` : "",
    showInterior && snapshot.rooms?.trim() ? `${snapshot.rooms.trim()} ambientes` : "",
    showInterior && snapshot.garage?.trim() ? `${snapshot.garage.trim()} cocheras` : "",
    showCovered && snapshot.coveredAreaM2?.trim() ? `${snapshot.coveredAreaM2.trim()} m² cubiertos` : "",
    snapshot.totalAreaM2?.trim() ? `${snapshot.totalAreaM2.trim()} m² totales` : "",
    snapshot.landAreaM2?.trim() ? `${snapshot.landAreaM2.trim()} m² de terreno` : "",
  ].filter(Boolean);
  const descriptionPreview = (snapshot.description ?? "").trim().split("\n").find(Boolean) ?? "";
  const featureCount = snapshot.features?.length ?? 0;
  function fieldItem(name: string) {
    const help = fieldErrorMap[name];
    return help ? { validateStatus: "error" as const, help } : {};
  }
  const traitFieldError = ["bedrooms", "bathrooms", "rooms", "garage", "coveredAreaM2", "totalAreaM2", "landAreaM2"]
    .map((name) => fieldErrorMap[name])
    .find(Boolean);
  const copyFieldError = fieldErrorMap.description || fieldErrorMap.features;

  return (
    <ConfigProvider
      theme={{
        components: {
          Form: { itemMarginBottom: 12, verticalLabelPadding: "0 0 4px" },
          Card: { paddingLG: 16 },
        },
      }}
    >
    <Form
      form={form}
      layout="vertical"
      requiredMark={false}
      preserve
      initialValues={initialValues}
      scrollToFirstError={{ block: "center", focus: true }}
      aria-busy={busy}
      onValuesChange={(changed, values) => {
        setDirty(true);
        setSnapshot(values);
        setFieldErrorMap((current) => {
          const names = Object.keys(changed);
          if (!names.some((name) => current[name])) {
            return current;
          }
          const next = { ...current };
          for (const name of names) {
            delete next[name];
          }
          return next;
        });
      }}
      onFinishFailed={(info) => {
        setServerFieldErrors(info.errorFields.flatMap((field) => field.errors));
        setFormError("Revisá los campos marcados.");
        unlock();
      }}
      onFinish={(values) => {
        if (!submittingRef.current) {
          submittingRef.current = true;
          setLocked(true);
        }
        const intent = intentRef.current;
        setActiveIntent(intent);
        setFormError(null);
        setServerFieldErrors([]);
        setFieldErrorMap({});
        const input = toInput(values);
        if (intent === "publish") {
          const checked = normalizeProperty(input, "publish");
          if (!checked.value) {
            showFailure(values, "Para publicar faltan datos.", checked.errors);
            return;
          }
        }
        const invalidPhotos = photosRef.current?.invalidMessage() ?? null;
        if (invalidPhotos && intent !== "pause") {
          setFormError(invalidPhotos);
          unlock();
          return;
        }
        const photosPending = photosRef.current?.hasUnsaved() ?? false;
        const saveIntent: Intent = photosPending && intent === "publish" ? "save" : intent;
        const deferPublic = photosPending && status === "PUBLICADA" && saveIntent === "save";
        if (photosPending && intent === "publish") {
          setProgress(!property || status === "BORRADOR" ? "Guardando borrador…" : "Guardando…");
        } else if (photosPending) {
          setProgress(intent === "pause" ? "Pausando…" : "Guardando…");
        }
        const flow = photosPending ? "guardar-con-fotos" : intent === "publish" ? "publicar" : "guardar-sin-fotos";
        void (async () => {
          const flowStarted = performance.now();
          try {
            const existingId = property?.id ?? draftIdRef.current;
            const result = await postSave({
              id: existingId,
              intent: saveIntent,
              values: input,
              deferPublic,
            });
            if (!result.ok) {
              showFailure(values, result.message, result.fieldErrors);
              return;
            }
            draftIdRef.current = result.id;
            if (!property) {
              window.sessionStorage.setItem(NEW_PROPERTY_DRAFT_KEY, result.id);
            }
            if (photosPending && photosRef.current) {
              setProgress("Fotos: 0 listas");
              const uploaded = await photosRef.current.uploadCommitted(
                result.id,
                (done, total, failed) => {
                  setProgress(
                    total === 0
                      ? "Guardando fotos…"
                      : failed > 0
                        ? `Fotos: ${done} de ${total} listas · ${failed} con error`
                        : `Fotos: ${done} de ${total} listas`,
                  );
                },
                { refreshPublic: deferPublic },
              );
              if (!uploaded.ok) {
                const kept =
                  !property || status === "BORRADOR"
                    ? "La propiedad quedó en borrador."
                    : "Los datos de la ficha se guardaron.";
                setFormError(`${kept} ${uploaded.message} Podés reintentar sin crear otra ficha.`);
                unlock();
                return;
              }
              if (intent === "publish") {
                setProgress("Publicando…");
                if (photosRef.current.hasUnsaved()) {
                  setFormError("Todavía hay fotos sin guardar. La propiedad quedó en borrador.");
                  unlock();
                  return;
                }
                const published = await postSave({ id: result.id, intent: "publish", values: input });
                if (!published.ok) {
                  showFailure(values, published.message, published.fieldErrors);
                  return;
                }
              }
            }
            devTiming("editor", flow, flowStarted);
            openListing(intent);
          } catch {
            setFormError("No se pudo guardar. Intentá de nuevo.");
            unlock();
          }
        })();
      }}
    >
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <Link
          href="/admin"
          onClick={confirmLeave}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#e4e0d8] bg-white px-3 text-sm text-[#2a2a2a] transition-colors hover:border-[#155547] hover:text-[#155547] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155547]"
        >
          <IconArrowLeft />
          Volver a propiedades
        </Link>
        <h1 className="text-xl font-medium text-[#2a2a2a]">{property ? "Editar propiedad" : "Nueva propiedad"}</h1>
        <StatusBadge status={status} />
        {dirty || photosDirty ? <span className="text-sm text-[#5c5854]">Cambios sin guardar</span> : null}
      </div>

      {formError ? (
        <div id="form-error" tabIndex={-1} className="mb-3 rounded-lg outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9f2d2d]">
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

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_17.5rem]">
        <div className="flex min-w-0 flex-col gap-3">
          <Card title="Información general" styles={cardStyles}>
            <Form.Item
              label={<FieldLabel text="Título" required />}
              name="title"
              rules={[{ required: true, whitespace: true, message: "El título es obligatorio." }]}
              {...fieldItem("title")}
            >
              <Input maxLength={160} placeholder="Ejemplo: Departamento de 3 ambientes" />
            </Form.Item>
            <div className="grid gap-x-4 md:grid-cols-3">
              <Form.Item label={<FieldLabel text="Tipo de propiedad" required />} name="propertyType" {...fieldItem("propertyType")}>
                <Select allowClear placeholder="Elegí un tipo" options={PROPERTY_TYPES.map((type) => ({ value: type, label: type }))} />
              </Form.Item>
              <Form.Item label={<FieldLabel text="Operación" required />} name="operation" {...fieldItem("operation")}>
                <Select
                  allowClear
                  placeholder="Venta, alquiler o temporal"
                  options={PROPERTY_OPERATIONS.map((item) => ({ value: item, label: item }))}
                />
              </Form.Item>
              <Form.Item label={<FieldLabel text="Ubicación" required />} name="location" {...fieldItem("location")}>
                <LocationSelect locations={locationNames} loading={locationsLoading} onOpen={loadLocations} />
              </Form.Item>
            </div>
            <Form.Item name="locationPrecision" hidden>
              <Input />
            </Form.Item>
          </Card>

          <Card
            title="Precio"
            styles={cardStyles}
            extra={
              <span className="inline-flex items-center gap-2 text-sm font-normal text-[#5c5854]">
                Consultar precio
                <Form.Item name="priceOnRequest" valuePropName="checked" noStyle>
                  <Switch aria-label="Consultar precio" />
                </Form.Item>
              </span>
            }
          >
              <div className="grid gap-x-4 md:grid-cols-3">
                <Form.Item label={<FieldLabel text="Precio" required={!priceOnRequest} />} name="price" {...fieldItem("price")}>
                  <Input inputMode="decimal" placeholder="168000" disabled={priceOnRequest} />
                </Form.Item>
                <Form.Item label={<FieldLabel text="Moneda" required={!priceOnRequest} />} name="currency" {...fieldItem("currency")}>
                  <Select
                    allowClear
                    disabled={priceOnRequest}
                    placeholder="ARS o USD"
                    options={PROPERTY_CURRENCIES.map((currency) => ({
                      value: currency,
                      label: currency === "ARS" ? "Pesos (ARS)" : "Dólares (USD)",
                    }))}
                  />
                </Form.Item>
                <div className={showPeriod ? undefined : "invisible"} aria-hidden={!showPeriod}>
                  <Form.Item label="Período" name="pricePeriod" preserve {...fieldItem("pricePeriod")}>
                    <Select
                      allowClear
                      disabled={!showPeriod}
                      placeholder="Elegí un período"
                      options={PRICE_PERIODS.map((item) => ({ value: item, label: PERIOD_LABELS[item] }))}
                    />
                  </Form.Item>
                </div>
              </div>
            </Card>

          <Card title="Fotos" styles={cardStyles}>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-[#2a2a2a]">
                  {photoSummary.load === "loading"
                    ? "Cargando fotos…"
                    : photoSummary.load === "error" && photoSummary.total === 0
                      ? "No se pudieron cargar las fotos"
                      : photoSummary.total === 0
                        ? "Sin cargar"
                        : `${photoSummary.total} ${photoSummary.total === 1 ? "foto" : "fotos"}${photoSummary.coverUrl ? " · con portada" : ""}`}
                  {photoSummary.pending ? " · cambios sin guardar" : ""}
                </p>
                {photoSummary.message ? <p className="text-sm text-[#9f2d2d]">{photoSummary.message}</p> : null}
                {photoSummary.load === "error" ? (
                  <Button htmlType="button" className="mt-2" onClick={() => photosRef.current?.reload()}>
                    Reintentar
                  </Button>
                ) : null}
              </div>
              <Button
                htmlType="button"
                onClick={(event) => photosRef.current?.open(event.currentTarget)}
              >
                Administrar fotos
              </Button>
            </div>
            {photoSummary.thumbs.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {photoSummary.thumbs.map((thumb) => (
                  <div key={thumb.key} className="relative h-14 w-16 overflow-hidden rounded-md bg-[#f6f3ed]">
                    <BoundedThumb key={thumb.url || thumb.key} url={thumb.url} />
                    {thumb.cover ? <span className="absolute bottom-0 left-0 bg-[#155547]/80 px-1 text-[10px] text-white">Portada</span> : null}
                  </div>
                ))}
              </div>
            ) : null}
          </Card>

          <div className="grid gap-3 lg:grid-cols-2">
            <Card title="Características y superficies" styles={cardStyles}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-[#5c5854]">{traitBits.length > 0 ? traitBits.join(" · ") : "Sin cargar"}</p>
                  {traitFieldError ? <p className="mt-1 text-sm text-[#9f2d2d]">{traitFieldError}</p> : null}
                </div>
                <SectionButton label={traitBits.length > 0 ? "Editar" : "Agregar"} onClick={openTraits} />
              </div>
            </Card>
            <Card title="Descripción y adicionales" styles={cardStyles}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm text-[#5c5854]">
                    {descriptionPreview || featureCount > 0 ? descriptionPreview || "Sin descripción" : "Sin cargar"}
                  </p>
                  {featureCount > 0 ? (
                    <p className="text-sm text-[#5c5854]">{featureCount === 1 ? "1 etiqueta" : `${featureCount} etiquetas`}</p>
                  ) : null}
                  {copyFieldError ? <p className="mt-1 text-sm text-[#9f2d2d]">{copyFieldError}</p> : null}
                </div>
                <SectionButton label={descriptionPreview || featureCount > 0 ? "Editar" : "Agregar"} onClick={openCopy} />
              </div>
            </Card>
          </div>

          <div className="hidden" aria-hidden="true">
            <Form.Item name="bedrooms" preserve><Input /></Form.Item>
            <Form.Item name="bathrooms" preserve><Input /></Form.Item>
            <Form.Item name="rooms" preserve><Input /></Form.Item>
            <Form.Item name="garage" preserve><Input /></Form.Item>
            <Form.Item name="coveredAreaM2" preserve><Input /></Form.Item>
            <Form.Item name="totalAreaM2" preserve><Input /></Form.Item>
            <Form.Item name="landAreaM2" preserve><Input /></Form.Item>
            <Form.Item name="description" preserve><Input.TextArea /></Form.Item>
            <Form.Item name="features" preserve><Select mode="tags" /></Form.Item>
          </div>
        </div>

        <aside className="rounded-[10px] border border-[#e4e0d8] bg-white p-4 lg:sticky lg:top-4">
          <p className="text-sm text-[#5c5854]">Estado</p>
          <div className="mt-2">
            <StatusBadge status={status} />
          </div>
          <Form.Item className="mt-4 mb-0" label="Destacada" name="featured" valuePropName="checked" {...fieldItem("featured")}>
            <Switch aria-label="Destacada" disabled={busy} />
          </Form.Item>
          <div className="mt-4">
            <PropertyActions
              status={status}
              saveLabel={saveLabel}
              busy={busy}
              activeIntent={activeIntent}
              onIntent={chooseIntent}
              stacked
            />
          </div>
          {listingNote ? (
            <p className="mt-3 text-sm text-[#5c5854]" role="status">
              {listingNote}
            </p>
          ) : null}
        </aside>
      </div>

      <PropertyPhotos
        ref={photosRef}
        propertyId={photoPropertyId}
        onChange={setPhotoSummary}
        onPrepareProperty={preparePhotoProperty}
      />

      <Modal
        open={progress !== null}
        footer={null}
        closable={false}
        maskClosable={false}
        keyboard={false}
        centered
        destroyOnHidden
        width={360}
        styles={{
          header: { display: "none" },
          content: { borderRadius: 16, padding: 0, background: "#fbfaf7", overflow: "hidden" },
          body: { padding: "32px 32px 28px" },
        }}
      >
        <SavingStatus message={progress ?? "Guardando…"} />
      </Modal>

      <Modal
        open={traitsOpen}
        title="Características y superficies"
        width="min(720px, calc(100vw - 24px))"
        destroyOnHidden
        maskClosable={false}
        onCancel={closeTraits}
        afterClose={() => traitsFocus.current?.focus()}
        styles={{ body: { maxHeight: "min(62vh, 560px)", overflowY: "auto" } }}
        footer={[
          <Button key="cancel" htmlType="button" onClick={closeTraits}>Cancelar</Button>,
          <Button key="apply" htmlType="button" type="primary" onClick={applyTraits}>Aplicar</Button>,
        ]}
      >
        <p className="mb-3 text-sm text-[#5c5854]">Vacío significa que no lo sabés. Cero es un dato real.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {showBedrooms ? (
            <label className="text-sm text-[#2a2a2a]">
              Dormitorios
              <Input className="mt-1" inputMode="numeric" value={traitDraft.bedrooms} onChange={(event) => setTraitDraft((current) => ({ ...current, bedrooms: event.target.value }))} />
            </label>
          ) : null}
          {showInterior ? (
            <label className="text-sm text-[#2a2a2a]">
              Baños
              <Input className="mt-1" inputMode="numeric" value={traitDraft.bathrooms} onChange={(event) => setTraitDraft((current) => ({ ...current, bathrooms: event.target.value }))} />
            </label>
          ) : null}
          {showInterior ? (
            <label className="text-sm text-[#2a2a2a]">
              Ambientes
              <Input className="mt-1" inputMode="numeric" value={traitDraft.rooms} onChange={(event) => setTraitDraft((current) => ({ ...current, rooms: event.target.value }))} />
            </label>
          ) : null}
          {showInterior ? (
            <label className="text-sm text-[#2a2a2a]">
              Cocheras
              <Input className="mt-1" inputMode="numeric" value={traitDraft.garage} onChange={(event) => setTraitDraft((current) => ({ ...current, garage: event.target.value }))} />
            </label>
          ) : null}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {showCovered ? (
            <label className="text-sm text-[#2a2a2a]">
              Superficie cubierta
              <Input className="mt-1" inputMode="decimal" suffix="m²" value={traitDraft.coveredAreaM2} onChange={(event) => setTraitDraft((current) => ({ ...current, coveredAreaM2: event.target.value }))} />
            </label>
          ) : null}
          <label className="text-sm text-[#2a2a2a]">
            Superficie total
            <Input className="mt-1" inputMode="decimal" suffix="m²" value={traitDraft.totalAreaM2} onChange={(event) => setTraitDraft((current) => ({ ...current, totalAreaM2: event.target.value }))} />
          </label>
          <label className="text-sm text-[#2a2a2a]">
            Superficie del terreno
            <Input className="mt-1" inputMode="decimal" suffix="m²" value={traitDraft.landAreaM2} onChange={(event) => setTraitDraft((current) => ({ ...current, landAreaM2: event.target.value }))} />
          </label>
        </div>
        {!showBedrooms && typedType ? (
          <p className="mt-3 text-sm text-[#5c5854]">
            {typeIsLand(typedType) ? "Este tipo no usa dormitorios, baños, ambientes ni cocheras." : "Este tipo no usa dormitorios."}
          </p>
        ) : null}
      </Modal>

      <Modal
        open={copyOpen}
        title="Descripción y adicionales"
        width="min(720px, calc(100vw - 24px))"
        destroyOnHidden
        maskClosable={false}
        onCancel={closeCopy}
        afterClose={() => copyFocus.current?.focus()}
        styles={{ body: { maxHeight: "min(62vh, 560px)", overflowY: "auto" } }}
        footer={[
          <Button key="cancel" htmlType="button" onClick={closeCopy}>Cancelar</Button>,
          <Button key="apply" htmlType="button" type="primary" onClick={applyCopy}>Aplicar</Button>,
        ]}
      >
        <label className="text-sm text-[#2a2a2a]">
          Descripción
          <Input.TextArea
            className="mt-1"
            rows={8}
            maxLength={8000}
            value={copyDraft.description}
            onChange={(event) => setCopyDraft((current) => ({ ...current, description: event.target.value }))}
          />
        </label>
        <div className="mt-4">
          <p className="text-sm text-[#2a2a2a]">Características</p>
          <div className="mt-2 flex gap-2">
            <Input
              value={tagText}
              placeholder="Escribí y presioná Enter"
              onChange={(event) => setTagText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addTag();
                }
              }}
            />
            <Button htmlType="button" onClick={addTag}>Agregar</Button>
          </div>
          <ul className="mt-2 flex flex-wrap gap-2">
            {copyDraft.features.map((feature) => (
              <li key={feature}>
                <button
                  type="button"
                  className="rounded-full border border-[#e4e0d8] px-3 py-1 text-sm text-[#2a2a2a]"
                  onClick={() => setCopyDraft((current) => ({ ...current, features: current.features.filter((item) => item !== feature) }))}
                >
                  {feature} ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      </Modal>
    </Form>
    </ConfigProvider>
  );
}
