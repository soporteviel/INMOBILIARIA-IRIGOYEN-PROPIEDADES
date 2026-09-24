"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { site } from "@/config/site";
import { Container } from "@/components/ui";
import { IconMenu } from "@/components/icons";

export function Header() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-linea bg-white text-verde-profundo">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-verde focus:px-3 focus:py-2 focus:text-white"
      >
        Saltar al contenido
      </a>
      <Container className="flex items-center justify-between gap-4 py-2">
        <a href="/" className="shrink-0" onClick={() => setOpen(false)}>
          <Image
            src={site.logo.src}
            alt={site.logo.alt}
            width={site.logo.width}
            height={site.logo.height}
            className="h-16 w-16 object-contain sm:h-20 sm:w-20"
            priority
          />
        </a>

        <nav aria-label="Principal" className="hidden lg:block">
          <ul className="flex items-center gap-8">
            {site.nav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="text-sm tracking-wide text-tinta transition-colors hover:text-verde"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center text-verde-profundo lg:hidden"
          aria-expanded={open}
          aria-controls="menu-movil"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">{open ? "Cerrar menú" : "Abrir menú"}</span>
          <IconMenu open={open} />
        </button>
      </Container>

      {open ? (
        <div id="menu-movil" className="border-t border-linea bg-white lg:hidden">
          <Container>
            <nav aria-label="Móvil">
              <ul className="flex flex-col py-4">
                {site.nav.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className="block py-3 font-serif text-2xl text-verde-profundo"
                      onClick={() => setOpen(false)}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
