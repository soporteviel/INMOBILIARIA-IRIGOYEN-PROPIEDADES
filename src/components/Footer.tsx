import Image from "next/image";
import Link from "next/link";
import { isConfigured, site, whatsappLink } from "@/config/site";
import { Container } from "@/components/ui";

export function Footer() {
  const year = new Date().getFullYear();
  const whatsapp = whatsappLink(
    "Hola, quería hacer una consulta sobre una propiedad.",
  );

  return (
    <footer className="border-t border-linea bg-white text-tinta">
      <Container className="py-12 sm:py-16">
        <div className="grid gap-10 md:grid-cols-[auto_1fr_1fr] md:items-start">
          <Link href="/" className="justify-self-start">
            <Image
              src={site.logo.src}
              alt={site.logo.alt}
              width={site.logo.width}
              height={site.logo.height}
              className="h-24 w-24 object-contain"
            />
          </Link>

          <nav aria-label="Pie de página">
            <p className="mb-4 text-xs uppercase tracking-[0.18em] text-verde">
              Navegación
            </p>
            <ul className="space-y-2">
              {site.nav.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="text-sm text-tinta transition-colors hover:text-verde"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.18em] text-verde">
              Contacto
            </p>
            <ul className="space-y-2 text-sm text-tinta">
              <li>
                {whatsapp ? (
                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-verde"
                  >
                    {site.contact.whatsappDisplay}
                  </a>
                ) : (
                  "WhatsApp pendiente"
                )}
              </li>
              <li>
                {isConfigured(site.contact.email) ? (
                  <a
                    href={`mailto:${site.contact.email}`}
                    className="break-all hover:text-verde"
                  >
                    {site.contact.email}
                  </a>
                ) : (
                  "Email pendiente"
                )}
              </li>
              <li>
                {isConfigured(site.contact.instagramUrl) ? (
                  <a
                    href={site.contact.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-verde"
                  >
                    @{site.contact.instagramHandle}
                  </a>
                ) : (
                  "Instagram pendiente"
                )}
              </li>
            </ul>
            <p className="mt-6 max-w-xs text-xs leading-relaxed text-muted">
              {site.profession}
              <br />
              {site.license}
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-linea pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">
            © {year} {site.name}
          </p>
          <a
            href={site.developer.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 self-end text-muted transition-colors hover:text-verde"
            aria-label={`Desarrollado por ${site.developer.name}`}
          >
            <span className="text-xs uppercase tracking-[0.16em]">
              Desarrollado por
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={site.developer.logo}
              alt=""
              width={22}
              height={22}
              className="size-[22px] rounded-[5px]"
            />
          </a>
        </div>
      </Container>
    </footer>
  );
}
