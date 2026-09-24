import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Container } from "@/components/ui";

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="contenido" className="bg-crema">
        <Container className="py-20 sm:py-28">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-verde">
            404
          </p>
          <h1 className="mt-3 font-serif text-3xl text-verde-profundo sm:text-4xl">
            No encontramos esta página
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
            El enlace puede estar desactualizado o la propiedad ya no está publicada.
          </p>
          <Link
            href="/propiedades"
            className="mt-8 inline-flex min-h-12 items-center bg-verde px-6 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde"
          >
            Ver propiedades
          </Link>
        </Container>
      </main>
      <Footer />
    </>
  );
}
