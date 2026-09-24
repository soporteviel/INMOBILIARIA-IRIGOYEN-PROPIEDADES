import type { ReactNode } from "react";

const controlClass =
  "w-full rounded-lg border border-linea bg-white px-3.5 text-sm text-tinta shadow-[0_1px_2px_rgba(12,51,46,0.04)] outline-none transition-[border-color,box-shadow] placeholder:text-muted/65 hover:border-verde/45 focus:border-verde focus:ring-4 focus:ring-verde/12";

export function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-xs font-medium tracking-wide text-muted">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-red-800">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextInput({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  error,
  autoComplete,
  suffix,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "tel" | "number";
  placeholder?: string;
  required?: boolean;
  error?: string;
  autoComplete?: string;
  suffix?: string;
}) {
  return (
    <Field id={id} label={label} error={error}>
      <div className="relative mt-1.5">
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          required={required}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => onChange(event.target.value)}
          className={`${controlClass} h-11 ${suffix ? "pr-12" : ""}`}
        />
        {suffix ? (
          <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-muted">
            {suffix}
          </span>
        ) : null}
      </div>
    </Field>
  );
}

export function TextArea({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <Field id={id} label={label}>
      <textarea
        id={id}
        name={id}
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={`${controlClass} mt-1.5 min-h-24 resize-y py-2.5`}
      />
    </Field>
  );
}

export function ChoiceGroup({
  legend,
  name,
  value,
  options,
  onChange,
  error,
  columns = 2,
}: {
  legend: string;
  name: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
  error?: string;
  columns?: 2 | 4;
}) {
  return (
    <fieldset>
      <legend className="text-xs font-medium tracking-wide text-muted">
        {legend}
      </legend>
      <div
        className={`mt-1.5 grid gap-1.5 ${columns === 4 ? "grid-cols-4" : "grid-cols-2"}`}
      >
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <label
              key={option.value}
              className={`flex min-h-10 cursor-pointer items-center justify-center rounded-lg border px-2 text-sm transition-colors ${
                selected
                  ? "border-verde bg-verde text-papel shadow-[0_1px_2px_rgba(12,51,46,0.12)]"
                  : "border-linea bg-white text-tinta shadow-[0_1px_2px_rgba(12,51,46,0.04)] hover:border-verde/45"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                className="sr-only"
                onChange={() => onChange(option.value)}
              />
              {option.label}
            </label>
          );
        })}
      </div>
      {error ? <p className="mt-1.5 text-sm text-red-800">{error}</p> : null}
    </fieldset>
  );
}
