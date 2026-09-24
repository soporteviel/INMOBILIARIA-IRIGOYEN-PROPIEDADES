import type { ReactNode } from "react";
import { isConfigured, site, whatsappLink } from "@/config/site";
import {
  IconInstagram,
  IconMail,
  IconWhatsApp,
} from "@/components/icons";
import { ButtonLink, Container, PendingValue } from "@/components/ui";

type ContactItem = {
  label: string;
  icon: ReactNode;
  value?: string;
  href?: string | null;
  external?: boolean;
};

export function Contact() {
  const whatsapp = whatsappLink(
    "Hola, quería hacer una consulta sobre una propiedad.",
  );

  const items: ContactItem[] = [
    {
      label: "WhatsApp",
      icon: <IconWhatsApp />,
      value: site.contact.whatsappDisplay,
      href: whatsapp,
      external: true,
    },
    {
      label: "Email",
      icon: <IconMail />,
      value: site.contact.email,
      href: isConfigured(site.contact.email)
        ? `mailto:${site.contact.email}`
        : null,
    },
    {
      label: "Instagram",
      icon: <IconInstagram />,
      value: isConfigured(site.contact.instagramHandle)
        ? `@${site.contact.instagramHandle}`
        : undefined,
      href: site.contact.instagramUrl,
      external: true,
    },
  ];

  return (
    <section id="contacto" className="bg-crema pt-14 pb-16 sm:pt-16 sm:pb-20">
      <Container>
        <div className="grid gap-12 lg:grid-cols-2 lg:items-end">
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-verde">
              Contacto
            </p>
            <h2 className="font-serif text-3xl font-semibold leading-tight text-verde-profundo sm:text-4xl">
              Escribinos
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-muted sm:text-lg">
              Si querés ver una propiedad, solicitar una tasación o hacer una
              consulta, podés comunicarte por WhatsApp, mail o Instagram.
            </p>
            {whatsapp ? (
              <div className="mt-8">
                <ButtonLink href={whatsapp} external>
                  Escribir por WhatsApp
                </ButtonLink>
              </div>
            ) : null}
          </div>

          <ul className="flex flex-col gap-5">
            {items.map((item) => (
              <li key={item.label}>
                {isConfigured(item.value) && isConfigured(item.href) ? (
                  <a
                    href={item.href}
                    className="group inline-flex max-w-full items-center gap-3.5 text-tinta"
                    {...(item.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center text-verde">
                      {item.icon}
                    </span>
                    <span className="whitespace-nowrap text-sm tracking-tight underline decoration-verde/30 underline-offset-[6px] transition-colors group-hover:text-verde group-hover:decoration-verde sm:text-base">
                      {item.value}
                    </span>
                    <span className="sr-only">{item.label}</span>
                  </a>
                ) : (
                  <p className="inline-flex items-center gap-3.5 text-sm sm:text-base">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center text-verde">
                      {item.icon}
                    </span>
                    <PendingValue />
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
