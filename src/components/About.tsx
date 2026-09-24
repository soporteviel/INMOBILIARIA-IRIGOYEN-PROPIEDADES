import Image from "next/image";
import { site } from "@/config/site";
import { Container } from "@/components/ui";

export function About() {
  return (
    <section id="nosotros" className="bg-crema py-20 sm:py-28">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative aspect-square w-full overflow-hidden bg-salvia shadow-[0_18px_50px_rgba(12,51,46,0.12)]">
            <Image
              src="/images/nosotros.jpg"
              alt="Tarjetas de Noelia Irigoyen Propiedades"
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 40vw, 90vw"
            />
          </div>
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-verde">
              Nosotros
            </p>
            <h2 className="font-serif text-3xl font-semibold leading-tight text-verde-profundo sm:text-4xl">
              {site.name}
            </h2>
            <p className="mt-3 text-sm uppercase tracking-[0.14em] text-muted">
              {site.profession}
            </p>
            <div className="mt-6 space-y-4">
              <p className="text-base leading-relaxed text-tinta/90 sm:text-lg">
                {site.name} acompaña a quienes buscan comprar, vender o alquilar
                una propiedad, con una atención cercana y clara en cada
                consulta.
              </p>
              <p className="text-sm text-muted">{site.license}</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
