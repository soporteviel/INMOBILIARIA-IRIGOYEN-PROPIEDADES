import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PropertyCard } from "@/components/PropertyCard";
import { PropertyGallery } from "@/components/property/PropertyGallery";
import {
  PropertyFacts,
  PropertyInquiry,
} from "@/components/property/PropertySummary";
import { Container, PropertyTitle } from "@/components/ui";
import { site, whatsappLink } from "@/config/site";
import {
  detailPrice,
  featuredProperties,
  getOtherProperties,
  getPropertyBySlug,
} from "@/data/properties";

type PropertyPageProps = {
  params: Promise<{ slug: string }>;
};

async function propertyUrl(slug: string) {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  if (!host) {
    return `/propiedades/${slug}`;
  }
  return `${proto}://${host}/propiedades/${slug}`;
}

export function generateStaticParams() {
  return featuredProperties.map((property) => ({ slug: property.slug }));
}

export async function generateMetadata({
  params,
}: PropertyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const property = getPropertyBySlug(slug);
  if (!property) {
    return { title: `Propiedad no encontrada | ${site.name}` };
  }
  return {
    title: `${property.title} | ${site.name}`,
    description: property.description ?? `${property.title} en ${property.location}.`,
  };
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { slug } = await params;
  const property = getPropertyBySlug(slug);
  if (!property) {
    notFound();
  }

  const priceLabel = detailPrice(property.price);
  const url = await propertyUrl(property.slug);
  const whatsappHref = whatsappLink(
    `Hola, quiero consultar por ${property.title}. ${url}`,
  );
  const paragraphs = property.description
    ?.split(/\n\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const others = getOtherProperties(property.slug);
  const precisionLabel =
    property.locationPrecision === "approximate"
      ? "Ubicación aproximada"
      : property.locationPrecision === "exact"
        ? "Ubicación exacta"
        : null;

  return (
    <>
      <Header />
      <main id="contenido" className="bg-crema pb-16 lg:pb-20">
        <Container className="pt-5 sm:pt-6">
          <nav aria-label="Ruta" className="text-sm text-muted">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <li>
                <Link href="/" className="hover:text-verde">
                  Inicio
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/propiedades" className="hover:text-verde">
                  Propiedades
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-tinta" aria-current="page">
                {property.title}
              </li>
            </ol>
          </nav>

          <div className="mt-4">
            <PropertyGallery photos={property.photos} />
          </div>

          <header className="mt-8 max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-verde">
              {property.operation} · {property.type}
            </p>
            <h1 className="mt-2 font-serif text-3xl font-semibold leading-tight text-verde-profundo sm:text-4xl">
              <PropertyTitle text={property.title} />
            </h1>
            <p className="mt-2 text-sm text-muted">{property.location}</p>
            <p className="mt-4 font-sans text-2xl font-semibold tabular-nums text-verde">
              {priceLabel}
            </p>
          </header>

          <div className="mt-10 grid gap-12 lg:grid-cols-3 lg:gap-16">
            <div className="min-w-0 lg:col-span-2">
              <PropertyFacts property={property} />

              {paragraphs && paragraphs.length > 0 ? (
                <div className="mt-8 max-w-2xl space-y-4 text-base leading-relaxed text-tinta">
                  {paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              ) : null}

              {property.features && property.features.length > 0 ? (
                <section className="mt-10">
                  <h2 className="font-serif text-2xl text-verde-profundo">
                    Características
                  </h2>
                  <ul className="mt-4 grid gap-x-10 sm:grid-cols-2">
                    {property.features.map((feature) => (
                      <li
                        key={feature}
                        className="border-b border-linea py-2.5 text-sm text-tinta"
                      >
                        {feature}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>

            <PropertyInquiry whatsappHref={whatsappHref} />
          </div>

          <section className="mt-14 border-t border-linea pt-8">
            <h2 className="font-serif text-2xl text-verde-profundo">Ubicación</h2>
            <p className="mt-3 text-base text-tinta">{property.location}</p>
            {precisionLabel ? (
              <p className="mt-1 text-sm text-muted">{precisionLabel}</p>
            ) : null}
          </section>

          {others.length > 0 ? (
            <section className="mt-14 border-t border-linea pt-8">
              <h2 className="font-serif text-2xl text-verde-profundo">
                Otras propiedades
              </h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {others.map((item) => (
                  <PropertyCard key={item.id} property={item} />
                ))}
              </div>
            </section>
          ) : null}
        </Container>
      </main>
      <Footer />
    </>
  );
}
