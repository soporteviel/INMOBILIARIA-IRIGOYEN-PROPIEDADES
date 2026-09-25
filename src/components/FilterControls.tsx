"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { IconCheck, IconChevron } from "@/components/icons";

export const filterLabelClass =
  "mb-1.5 block text-xs font-medium tracking-wide text-muted";
export const filterTriggerClass =
  "flex w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-lg border border-linea bg-white px-3.5 text-left text-sm text-tinta shadow-[0_1px_2px_rgba(12,51,46,0.04)] outline-none transition-[border-color,box-shadow] hover:border-verde/45 focus-visible:border-verde focus-visible:ring-4 focus-visible:ring-verde/12";

export const OPERATION_LABELS: Record<string, string> = {
  Venta: "Propiedades en venta",
  Alquiler: "Propiedades en alquiler",
  Temporal: "Propiedades temporales",
};

export function locationLabel(value: string) {
  return value === "Todas" ? "Todas las ubicaciones" : value;
}

export function typeLabel(value: string) {
  return value === "Todos" ? "Todos los tipos" : value;
}

export function OperationTab({
  selected,
  onSelect,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`cursor-pointer border-b-2 pb-1 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde ${
        selected
          ? "border-verde font-medium text-verde"
          : "border-transparent text-muted hover:text-tinta"
      }`}
    >
      {children}
    </button>
  );
}

export function FilterSelect({
  id,
  label,
  name,
  value,
  options,
  open,
  onToggle,
  onClose,
  onChange,
  getOptionLabel = (option: string) => option,
  hideLabel = false,
  bare = false,
  compact = false,
}: {
  id: string;
  label: string;
  name: string;
  value: string;
  options: readonly string[];
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onChange: (value: string) => void;
  getOptionLabel?: (option: string) => string;
  hideLabel?: boolean;
  bare?: boolean;
  compact?: boolean;
}) {
  const listId = useId();
  const labelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(
      0,
      options.findIndex((option) => option === value),
    ),
  );
  const selectionKey = open ? `${value}\n${options.join("\n")}` : "";
  const [trackedSelection, setTrackedSelection] = useState(selectionKey);
  if (selectionKey !== trackedSelection) {
    setTrackedSelection(selectionKey);
    if (open) {
      const selectedIndex = options.findIndex((option) => option === value);
      setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    }
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }
    optionRefs.current[activeIndex]?.focus();
  }, [open, activeIndex]);

  function selectOption(option: string) {
    onChange(option);
    onClose();
    triggerRef.current?.focus();
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (
      event.key === "ArrowDown" ||
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      if (!open) {
        onToggle();
      }
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      onClose();
    }
  }

  function onListKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      triggerRef.current?.focus();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % options.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(
        (current) => (current - 1 + options.length) % options.length,
      );
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(options.length - 1);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectOption(options[activeIndex] ?? options[0]);
    }
  }

  const heightClass = compact ? "h-11" : "h-12";

  return (
    <div
      ref={rootRef}
      className={`relative min-w-0 ${open ? "z-40" : ""} ${bare ? "h-full" : ""}`}
    >
      {hideLabel ? (
        <span className="sr-only" id={labelId}>
          {label}
        </span>
      ) : (
        <span className={filterLabelClass} id={labelId}>
          {label}
        </span>
      )}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={labelId}
        aria-controls={listId}
        onClick={onToggle}
        onKeyDown={onTriggerKeyDown}
        className={
          bare
            ? "flex h-full w-full cursor-pointer items-center justify-between gap-1 border-0 bg-transparent px-3 text-left text-sm text-tinta outline-none"
            : `${filterTriggerClass} ${heightClass} ${open ? "border-verde ring-4 ring-verde/12" : ""}`
        }
      >
        <span className="truncate">{getOptionLabel(value)}</span>
        <IconChevron open={open} />
      </button>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-labelledby={labelId}
          tabIndex={-1}
          onKeyDown={onListKeyDown}
          className={`select-menu-scroll absolute z-40 max-h-64 overflow-auto rounded-lg border border-linea bg-white p-1 shadow-[0_12px_32px_rgba(12,51,46,0.14)] ${
            bare
              ? "top-[calc(100%+6px)] left-0 min-w-[6.5rem]"
              : "mt-1.5 w-full"
          }`}
        >
          {options.map((option, index) => {
            const selected = option === value;
            const active = index === activeIndex;
            return (
              <li key={option} role="presentation">
                <button
                  ref={(node) => {
                    optionRefs.current[index] = node;
                  }}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  tabIndex={active ? 0 : -1}
                  className={`flex min-h-10 w-full cursor-pointer items-center justify-between gap-3 rounded-md px-3 text-left text-sm transition-colors ${
                    selected
                      ? "bg-salvia-clara font-medium text-verde"
                      : active
                        ? "bg-crema text-tinta"
                        : "text-tinta hover:bg-crema"
                  }`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectOption(option)}
                >
                  <span className="truncate">{getOptionLabel(option)}</span>
                  {selected ? <IconCheck className="h-4 w-4 shrink-0" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
