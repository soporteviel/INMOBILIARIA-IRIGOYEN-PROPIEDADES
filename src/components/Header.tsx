"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { site } from "@/config/site";
import { Container } from "@/components/ui";
import { IconMenu } from "@/components/icons";

function sectionHref(href: string, homePath: string) {
  if (homePath === "/" || !href.startsWith("/#")) {
    return href;
  }
  return `${homePath}${href.slice(1)}`;
}

export function Header({
  variant = "solid",
  homePath = "/",
}: {
  variant?: "solid" | "overlay";
  homePath?: string;
}) {
  const [open, setOpen] = useState(false);
  const [overHero, setOverHero] = useState(true);
  const overlay = variant === "overlay";
  const solidLook = !overlay || open || !overHero;

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!overlay) {
      return;
    }

    function update() {
      const hero = document.getElementById("inicio");
      const header = document.querySelector("[data-site-header]");
      if (!hero || !(header instanceof HTMLElement)) {
        return;
      }
      const next = hero.getBoundingClientRect().bottom > header.getBoundingClientRect().bottom;
      setOverHero((current) => (current === next ? current : next));
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [overlay]);

  const headerClass = overlay
    ? `fixed inset-x-0 top-0 z-50 border-b motion-safe:transition-colors motion-safe:duration-300 motion-reduce:transition-none ${
        solidLook
          ? "border-linea bg-white text-verde-profundo"
          : "border-transparent bg-transparent text-white"
      }`
    : "sticky top-0 z-50 border-b border-linea bg-white text-verde-profundo";

  const linkClass = !overlay
    ? "text-sm tracking-wide text-tinta transition-colors hover:text-verde"
    : solidLook
      ? "text-sm tracking-wide text-tinta motion-safe:transition-colors motion-safe:duration-300 motion-reduce:transition-none hover:text-verde focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-verde"
      : "text-sm tracking-wide text-white motion-safe:transition-colors motion-safe:duration-300 motion-reduce:transition-none hover:text-white/80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white";

  return (
    <header className={headerClass} data-site-header>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-verde focus:px-3 focus:py-2 focus:text-white"
      >
        Saltar al contenido
      </a>
      <Container className="flex items-center justify-between gap-4 py-3">
        <Link href={homePath === "/" ? "/" : `${homePath}#inicio`} className="shrink-0" onClick={() => setOpen(false)}>
          {overlay ? (
            <span className="relative block h-20 w-20 sm:h-24 sm:w-24">
              <Image
                src={site.logo.src}
                alt={solidLook ? site.logo.alt : ""}
                width={site.logo.width}
                height={site.logo.height}
                aria-hidden={solidLook ? undefined : true}
                className={`absolute inset-0 h-20 w-20 object-contain motion-safe:transition-opacity motion-safe:duration-300 motion-reduce:transition-none sm:h-24 sm:w-24 ${
                  solidLook ? "opacity-100" : "opacity-0"
                }`}
              />
              <Image
                src={site.logoOnDark.src}
                alt={solidLook ? "" : site.logoOnDark.alt}
                width={site.logoOnDark.width}
                height={site.logoOnDark.height}
                aria-hidden={solidLook ? true : undefined}
                priority
                className={`absolute inset-0 h-20 w-20 object-contain motion-safe:transition-opacity motion-safe:duration-300 motion-reduce:transition-none sm:h-24 sm:w-24 ${
                  solidLook ? "opacity-0" : "opacity-100"
                }`}
              />
            </span>
          ) : (
            <Image
              src={site.logo.src}
              alt={site.logo.alt}
              width={site.logo.width}
              height={site.logo.height}
              className="h-20 w-20 object-contain sm:h-24 sm:w-24"
              priority
            />
          )}
        </Link>

        <nav aria-label="Principal" className="hidden lg:block">
          <ul className="flex items-center gap-8">
            {site.nav.map((item) => (
              <li key={item.href}>
                <a href={sectionHref(item.href, homePath)} className={linkClass}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <button
          type="button"
          className={`inline-flex min-h-11 min-w-11 items-center justify-center lg:hidden ${
            !overlay
              ? "text-verde-profundo"
              : solidLook
                ? "text-verde-profundo motion-safe:transition-colors motion-safe:duration-300 motion-reduce:transition-none"
                : "text-white motion-safe:transition-colors motion-safe:duration-300 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          }`}
          aria-expanded={open}
          aria-controls="menu-movil"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">{open ? "Cerrar menú" : "Abrir menú"}</span>
          <IconMenu open={open} />
        </button>
      </Container>

      {open ? (
        <div id="menu-movil" className="border-t border-linea bg-white text-verde-profundo lg:hidden">
          <Container>
            <nav aria-label="Móvil">
              <ul className="flex flex-col py-4">
                {site.nav.map((item) => (
                  <li key={item.href}>
                    <a
                      href={sectionHref(item.href, homePath)}
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
