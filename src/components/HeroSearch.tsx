"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  FilterSelect,
  locationLabel,
  typeLabel,
} from "@/components/FilterControls";
import { getPropertyFilterOptions } from "@/data/properties";
import { searchFromControls, toPropertySearchQuery } from "@/data/property-search";

export function HeroSearch() {
  const router = useRouter();
  const options = useMemo(() => getPropertyFilterOptions(), []);

  const [openSelect, setOpenSelect] = useState<string | null>(null);
  const [operacion, setOperacion] = useState("");
  const [ubicacion, setUbicacion] = useState("Todas");
  const [tipo, setTipo] = useState("Todos");

  function closeSelect() {
    setOpenSelect(null);
  }

  function toggleSelect(id: string) {
    setOpenSelect((current) => (current === id ? null : id));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = toPropertySearchQuery(
      searchFromControls({
        operacion,
        ubicacion,
        tipo,
        moneda: "USD",
        precioDesde: "",
        precioHasta: "",
        dormitorios: "Todos",
        superficieDesde: "",
        superficieHasta: "",
        cochera: "Todas",
      }),
    );
    router.push(query ? `/propiedades?${query}` : "/propiedades");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-4xl rounded-[6px] border border-white/20 bg-white/95 p-3 shadow-none backdrop-blur-sm sm:p-4"
      aria-label="Buscar propiedades"
    >
      {options.operations.length > 1 ? (
        <div
          className="mb-3 grid grid-cols-3 border-b border-linea pb-2 sm:flex sm:w-fit sm:flex-wrap sm:items-center sm:gap-x-4 sm:pb-2.5"
          role="radiogroup"
          aria-label="Operación"
        >
          <OperationChoice
            selected={operacion === ""}
            onSelect={() => setOperacion("")}
          >
            Todas
          </OperationChoice>
          {options.operations.map((option) => (
            <OperationChoice
              key={option}
              selected={operacion === option}
              onSelect={() => setOperacion(option)}
            >
              {option}
            </OperationChoice>
          ))}
          <input className="hidden" type="hidden" name="operacion" value={operacion} />
        </div>
      ) : options.operations.length === 1 ? (
        <input type="hidden" name="operacion" value={options.operations[0]} />
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] lg:items-end">
        <FilterSelect
          id="hero-ubicacion"
          label="Ubicación"
          name="ubicacion"
          value={ubicacion}
          options={options.locations}
          getOptionLabel={locationLabel}
          open={openSelect === "ubicacion"}
          onToggle={() => toggleSelect("ubicacion")}
          onClose={closeSelect}
          onChange={setUbicacion}
          compact
        />

        <FilterSelect
          id="hero-tipo"
          label="Tipo de propiedad"
          name="tipo"
          value={tipo}
          options={options.types}
          getOptionLabel={typeLabel}
          open={openSelect === "tipo"}
          onToggle={() => toggleSelect("tipo")}
          onClose={closeSelect}
          onChange={setTipo}
          compact
        />

        <button
          type="submit"
          className="inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-lg bg-verde px-6 text-sm font-medium text-white transition-colors hover:bg-verde-medio focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde sm:col-span-2 lg:col-span-1 lg:w-[7.5rem]"
        >
          Buscar
        </button>
      </div>
    </form>
  );
}

function OperationChoice({
  selected,
  onSelect,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className="group w-full cursor-pointer py-1 text-center text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde sm:w-auto sm:text-left"
    >
      <span
        className={`inline-block border-b-2 pb-0.5 transition-colors ${
          selected
            ? "border-verde font-medium text-verde"
            : "border-transparent text-muted group-hover:border-verde group-hover:text-tinta"
        }`}
      >
        {children}
      </span>
    </button>
  );
}
