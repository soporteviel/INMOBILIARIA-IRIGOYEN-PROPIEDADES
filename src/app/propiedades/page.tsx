import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PropertyCard } from "@/components/PropertyCard";
import { PropertyFilters } from "@/components/PropertyFilters";
import { Container } from "@/components/ui";
import { site } from "@/config/site";
import { getPublishedProperties } from "@/data/properties";
import {
  filterProperties,
  hasActivePropertySearch,
  parsePropertySearch,
} from "@/data/property-search";

export const metadata: Metadata = {
  title: `Propiedades | ${site.name}`,
  description: site.description,
};

type PropiedadesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PropiedadesPage({ searchParams }: PropiedadesPageProps) {
  const search = parsePropertySearch(await searchParams);
  const results = filterProperties(getPublishedProperties(), search);
  const countLabel =
    results.length === 1 ? "1 propiedad" : `${results.length} propiedades`;

  return (
    <>
      <Header />
      <main id="contenido">
        <section className="bg-crema pt-8 pb-14 sm:pt-10 sm:pb-16">
          <Container>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
              <h1 className="font-serif text-3xl font-semibold leading-tight text-verde-profundo sm:text-[2.15rem]">
                Propiedades
              </h1>
              <p className="text-sm text-muted">{countLabel}</p>
            </div>

            <div className="mt-6">
              <Suspense fallback={null}>
                <PropertyFilters />
              </Suspense>
            </div>

            {results.length > 0 ? (
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            ) : (
              <div className="mt-10">
                <p className="text-base text-tinta">
                  No hay propiedades que coincidan con la búsqueda.
                </p>
                {hasActivePropertySearch(search) ? (
                  <Link
                    href="/propiedades"
                    className="mt-4 inline-flex text-sm text-verde transition-colors hover:text-verde-medio focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde"
                  >
                    Limpiar filtros
                  </Link>
                ) : null}
              </div>
            )}
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
