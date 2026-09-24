import type { ReactNode } from "react";

export function Container({
  children,
  className = "",
  wide = false,
}: {
  children: ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`mx-auto w-full px-5 sm:px-8 ${wide ? "max-w-7xl" : "max-w-6xl"} ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow ? (
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-verde">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-serif text-3xl font-semibold leading-tight text-verde-profundo sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className = "",
  external = false,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "light";
  className?: string;
  external?: boolean;
}) {
  const styles = {
    primary:
      "bg-verde text-papel hover:bg-verde-medio focus-visible:outline-verde-profundo",
    secondary:
      "border border-verde bg-transparent text-verde hover:bg-verde hover:text-papel focus-visible:outline-verde",
    light:
      "border border-papel/70 bg-transparent text-papel hover:bg-papel hover:text-verde-profundo focus-visible:outline-papel",
  }[variant];

  return (
    <a
      href={href}
      className={`inline-flex min-h-12 items-center justify-center px-6 text-sm font-medium tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${styles} ${className}`}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

export function DemoBadge() {
  return (
    <span className="inline-flex border border-verde/25 bg-salvia-clara px-2.5 py-1 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-verde">
      Demostración
    </span>
  );
}

export function PendingNote({ children }: { children: ReactNode }) {
  return (
    <p className="border-l-2 border-verde/40 bg-salvia-clara/80 px-4 py-3 text-sm italic leading-relaxed text-muted">
      {children}
    </p>
  );
}

export function PropertyTitle({ text }: { text: string }) {
  return text.split(/(\d+)/).map((part, index) =>
    /^\d+$/.test(part) ? (
      <span key={index} className="font-sans text-[0.86em] font-medium lining-nums">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

export function PendingValue({ label }: { label?: string }) {
  return (
    <span className="italic text-muted">
      {label ?? "Pendiente de confirmar"}
    </span>
  );
}
