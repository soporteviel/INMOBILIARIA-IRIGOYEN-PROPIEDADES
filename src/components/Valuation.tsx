import { Container } from "@/components/ui";
import { ValuationForm } from "@/components/ValuationForm";

export function Valuation() {
  return (
    <section id="tasaciones" className="bg-salvia-clara pt-14 pb-16 sm:pt-16 sm:pb-20">
      <Container wide>
        <div className="max-w-3xl">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-verde">
            Tasaciones
          </p>
          <h2 className="font-serif text-3xl font-semibold leading-tight text-verde-profundo sm:text-4xl">
            ¿Estás pensando en vender o alquilar?
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">
            Completá el formulario y te orientamos con una tasación.
          </p>
        </div>
        <div className="mt-12">
          <ValuationForm />
        </div>
      </Container>
    </section>
  );
}
