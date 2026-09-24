"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FilterSelect,
  OperationTab,
  OPERATION_LABELS,
  filterLabelClass as labelClass,
  locationLabel,
  typeLabel,
} from "@/components/FilterControls";
import { IconChevron } from "@/components/icons";
import {
  getPropertyFilterOptions,
  propertyUsesBedrooms,
  surfaceLabelForType,
} from "@/data/properties";
import {
  controlsFromSearch,
  parsePropertySearch,
  searchFromControls,
  toPropertySearchQuery,
  type PropertyCurrency,
} from "@/data/property-search";

export function PropertyFilters() {
  const searchParams = useSearchParams();
  return <PropertyFiltersForm key={searchParams.toString()} />;
}

function PropertyFiltersForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const options = useMemo(() => getPropertyFilterOptions(), []);
  const fallbackCurrency = (options.currencies[0] ?? "USD") as PropertyCurrency;
  const applied = controlsFromSearch(
    parsePropertySearch(new URLSearchParams(searchParams.toString())),
    fallbackCurrency,
  );

  const [openSelect, setOpenSelect] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(
    () =>
      applied.dormitorios !== "Todos" ||
      applied.cochera !== "Todas" ||
      applied.superficieDesde !== "" ||
      applied.superficieHasta !== "",
  );
  const [operacion, setOperacion] = useState(applied.operacion);
  const [tipo, setTipo] = useState(applied.tipo);
  const [ubicacion, setUbicacion] = useState(applied.ubicacion);
  const [moneda, setMoneda] = useState(applied.moneda);
  const [dormitorios, setDormitorios] = useState(applied.dormitorios);
  const [cochera, setCochera] = useState(applied.cochera);
  const [precioDesde, setPrecioDesde] = useState(applied.precioDesde);
  const [precioHasta, setPrecioHasta] = useState(applied.precioHasta);
  const [superficieDesde, setSuperficieDesde] = useState(applied.superficieDesde);
  const [superficieHasta, setSuperficieHasta] = useState(applied.superficieHasta);

  const showBedrooms =
    tipo === "Todos" ? options.showBedrooms : propertyUsesBedrooms(tipo);
  const surfaceLabel =
    tipo === "Todos" ? "Superficie" : surfaceLabelForType(tipo);

  function closeSelect() {
    setOpenSelect(null);
  }

  function toggleSelect(id: string) {
    setOpenSelect((current) => (current === id ? null : id));
  }

  function handleTipoChange(value: string) {
    setTipo(value);
    if (value !== "Todos" && !propertyUsesBedrooms(value)) {
      setDormitorios("Todos");
    }
  }

  function currentControls() {
    return {
      operacion,
      ubicacion,
      tipo,
      moneda,
      precioDesde,
      precioHasta,
      dormitorios,
      superficieDesde,
      superficieHasta,
      cochera,
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = toPropertySearchQuery(searchFromControls(currentControls()));
    router.push(next ? `/propiedades?${next}` : "/propiedades");
  }

  function handleClear() {
    setOperacion("");
    setTipo("Todos");
    setUbicacion("Todas");
    setMoneda(fallbackCurrency);
    setDormitorios("Todos");
    setCochera("Todas");
    setPrecioDesde("");
    setPrecioHasta("");
    setSuperficieDesde("");
    setSuperficieHasta("");
    setOpenSelect(null);
    router.push("/propiedades");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-visible rounded-[6px] border border-linea bg-white"
      aria-label="Filtros de propiedades"
    >
      <div className="border-b border-linea px-4 pt-3.5 pb-3 xl:px-5">
        {options.operations.length === 1 ? (
          <p className="text-sm text-muted">
            {OPERATION_LABELS[options.operations[0]] ??
              `Propiedades en ${options.operations[0].toLowerCase()}`}
          </p>
        ) : options.operations.length > 1 ? (
          <div
            className="flex flex-wrap items-center gap-x-4 gap-y-1"
            role="radiogroup"
            aria-label="Operación"
          >
            <OperationTab
              selected={operacion === ""}
              onSelect={() => setOperacion("")}
            >
              Todas
            </OperationTab>
            {options.operations.map((option) => (
              <OperationTab
                key={option}
                selected={operacion === option}
                onSelect={() => setOperacion(option)}
              >
                {option}
              </OperationTab>
            ))}
          </div>
        ) : null}
        {options.operations.length > 0 ? (
          <input type="hidden" name="operacion" value={operacion} />
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 md:items-end xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.6fr)_120px] xl:gap-4 xl:p-5">
        <div className="order-1 min-w-0 xl:order-1">
          <FilterSelect
            id="ubicacion"
            label="Ubicación"
            name="ubicacion"
            value={ubicacion}
            options={options.locations}
            getOptionLabel={locationLabel}
            open={openSelect === "ubicacion"}
            onToggle={() => toggleSelect("ubicacion")}
            onClose={closeSelect}
            onChange={setUbicacion}
          />
        </div>

        <div className="order-2 min-w-0 xl:order-2">
          <FilterSelect
            id="tipo"
            label="Tipo de propiedad"
            name="tipo"
            value={tipo}
            options={options.types}
            getOptionLabel={typeLabel}
            open={openSelect === "tipo"}
            onToggle={() => toggleSelect("tipo")}
            onClose={closeSelect}
            onChange={handleTipoChange}
          />
        </div>

        <div className="order-3 min-w-0 xl:order-3">
          <span className={labelClass} id="filtro-precio-label">
            Precio
          </span>
          <div
            className="flex h-12 min-w-0 items-stretch overflow-visible rounded-lg border border-linea bg-white shadow-[0_1px_2px_rgba(12,51,46,0.04)] transition-[border-color,box-shadow] focus-within:border-verde focus-within:ring-4 focus-within:ring-verde/12"
            role="group"
            aria-labelledby="filtro-precio-label"
          >
            {options.currencies.length > 1 ? (
              <div className="relative w-[4.75rem] shrink-0">
                <FilterSelect
                  id="moneda"
                  label="Moneda"
                  name="moneda"
                  value={moneda}
                  options={options.currencies}
                  open={openSelect === "moneda"}
                  onToggle={() => toggleSelect("moneda")}
                  onClose={closeSelect}
                  onChange={(value) => setMoneda(value as "USD" | "ARS")}
                  hideLabel
                  bare
                />
              </div>
            ) : (
              <>
                <span className="flex shrink-0 items-center px-3 text-sm text-muted">
                  {moneda}
                </span>
                <input type="hidden" name="moneda" value={moneda} />
              </>
            )}

            <span
              className="w-px shrink-0 self-stretch bg-[var(--linea)]"
              aria-hidden="true"
            />

            <label className="sr-only" htmlFor="filtro-precio-desde">
              Precio desde
            </label>
            <input
              id="filtro-precio-desde"
              type="text"
              name="precio-desde"
              inputMode="numeric"
              placeholder="Desde"
              value={precioDesde}
              onChange={(event) => setPrecioDesde(event.target.value)}
              className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-tinta outline-none placeholder:text-muted/65"
            />

            <span
              className="w-px shrink-0 self-stretch bg-[var(--linea)]"
              aria-hidden="true"
            />

            <label className="sr-only" htmlFor="filtro-precio-hasta">
              Precio hasta
            </label>
            <input
              id="filtro-precio-hasta"
              type="text"
              name="precio-hasta"
              inputMode="numeric"
              placeholder="Hasta"
              value={precioHasta}
              onChange={(event) => setPrecioHasta(event.target.value)}
              className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-tinta outline-none placeholder:text-muted/65"
            />
          </div>
        </div>

        <button
          type="submit"
          className="order-6 h-12 w-full cursor-pointer rounded-lg bg-verde text-sm font-medium text-white transition-colors hover:bg-verde-medio focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde md:order-4 xl:order-4"
        >
          Buscar
        </button>

        <div className="order-4 col-span-full flex items-center justify-between gap-3 md:order-5 xl:order-5">
          <button
            type="button"
            aria-expanded={moreOpen}
            aria-controls="filtros-adicionales"
            onClick={() => setMoreOpen((value) => !value)}
            className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-verde transition-colors hover:text-verde-medio focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde"
          >
            <IconChevron open={moreOpen} />
            Más filtros
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="cursor-pointer text-sm text-muted transition-colors hover:text-tinta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde"
          >
            Limpiar
          </button>
        </div>

        {moreOpen ? (
          <div
            id="filtros-adicionales"
            className="order-5 col-span-full grid grid-cols-1 gap-4 border-t border-linea pt-4 sm:grid-cols-2 lg:grid-cols-3 md:order-6 xl:order-6"
          >
            {showBedrooms ? (
              <FilterSelect
                id="dormitorios"
                label="Dormitorios"
                name="dormitorios"
                value={dormitorios}
                options={options.bedrooms}
                open={openSelect === "dormitorios"}
                onToggle={() => toggleSelect("dormitorios")}
                onClose={closeSelect}
                onChange={setDormitorios}
              />
            ) : null}

            <div className="min-w-0">
              <span className={labelClass} id="filtro-superficie-label">
                {surfaceLabel} (m²)
              </span>
              <div
                className="flex h-12 min-w-0 items-stretch overflow-hidden rounded-lg border border-linea bg-white shadow-[0_1px_2px_rgba(12,51,46,0.04)] transition-[border-color,box-shadow] focus-within:border-verde focus-within:ring-4 focus-within:ring-verde/12"
                role="group"
                aria-labelledby="filtro-superficie-label"
              >
                <label className="sr-only" htmlFor="filtro-superficie-desde">
                  {surfaceLabel} desde
                </label>
                <input
                  id="filtro-superficie-desde"
                  type="text"
                  name="superficie-desde"
                  inputMode="numeric"
                  placeholder="Desde"
                  value={superficieDesde}
                  onChange={(event) => setSuperficieDesde(event.target.value)}
                  className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-tinta outline-none placeholder:text-muted/65"
                />
                <span
                  className="w-px shrink-0 bg-[var(--linea)]"
                  aria-hidden="true"
                />
                <label className="sr-only" htmlFor="filtro-superficie-hasta">
                  {surfaceLabel} hasta
                </label>
                <input
                  id="filtro-superficie-hasta"
                  type="text"
                  name="superficie-hasta"
                  inputMode="numeric"
                  placeholder="Hasta"
                  value={superficieHasta}
                  onChange={(event) => setSuperficieHasta(event.target.value)}
                  className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-tinta outline-none placeholder:text-muted/65"
                />
              </div>
            </div>

            <FilterSelect
              id="cochera"
              label="Cochera"
              name="cochera"
              value={cochera}
              options={options.garage}
              open={openSelect === "cochera"}
              onToggle={() => toggleSelect("cochera")}
              onClose={closeSelect}
              onChange={setCochera}
            />
          </div>
        ) : null}
      </div>
    </form>
  );
}
