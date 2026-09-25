import Image from "next/image";
import type { ReactNode } from "react";
import { site } from "@/config/site";

export function AdminFrame({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main
      id="contenido"
      className="flex min-h-screen items-center justify-center bg-crema px-5 py-16"
    >
      <div className="w-full max-w-md border border-linea bg-white px-6 py-8 sm:px-8">
        <Image
          src={site.logo.src}
          alt={site.logo.alt}
          width={site.logo.width}
          height={site.logo.height}
          className="mx-auto h-16 w-16 object-contain"
          priority
        />
        <h1 className="mt-4 text-center font-serif text-3xl font-semibold text-verde-profundo">
          {title}
        </h1>
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}

export const adminFieldClass =
  "h-12 w-full border border-linea bg-white px-3 text-sm text-tinta outline-none placeholder:text-muted/70 focus:border-verde";

export const adminButtonClass =
  "inline-flex h-12 w-full cursor-pointer items-center justify-center bg-verde px-4 text-sm font-medium text-white transition-colors hover:bg-verde-medio focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde disabled:cursor-not-allowed disabled:opacity-60";

export const adminLinkClass =
  "text-sm text-verde transition-colors hover:text-verde-medio focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde";
