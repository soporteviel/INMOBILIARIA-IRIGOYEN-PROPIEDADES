import { PropertyCard } from "@/components/PropertyCard";
import { ButtonLink, Container, SectionHeading } from "@/components/ui";
import type { Property } from "@/data/properties";

export function FeaturedProperties({
  properties,
  error,
  photosUnavailable,
}: {
  properties: Property[];
  error: string | null;
  photosUnavailable: boolean;
}) {
  if (!error && properties.length === 0) {
    return null;
  }

  return (
    <section id="propiedades" className="bg-crema pt-14 pb-16 sm:pt-16 sm:pb-20">
      <Container>
        <SectionHeading eyebrow="Propiedades" title="Propiedades destacadas" />
        {error ? (
          <p className="mt-8 text-base text-tinta">{error}</p>
        ) : (
          <>
            {photosUnavailable ? (
              <p className="mt-8 text-base text-tinta">
                No pudimos cargar las fotos. Las fichas siguen disponibles.
              </p>
            ) : null}
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          </>
        )}
        <div className="mt-10 text-center">
          <ButtonLink href="/propiedades">Ver todas las propiedades</ButtonLink>
        </div>
      </Container>
    </section>
  );
}
