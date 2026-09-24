import { featuredProperties } from "@/data/properties";
import { PropertyCard } from "@/components/PropertyCard";
import { ButtonLink, Container, SectionHeading } from "@/components/ui";

export function FeaturedProperties() {
  return (
    <section id="propiedades" className="bg-crema pt-14 pb-16 sm:pt-16 sm:pb-20">
      <Container>
        <SectionHeading eyebrow="Propiedades" title="Propiedades destacadas" />
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
        <div className="mt-10 text-center">
          <ButtonLink href="/propiedades">Ver todas las propiedades</ButtonLink>
        </div>
      </Container>
    </section>
  );
}
