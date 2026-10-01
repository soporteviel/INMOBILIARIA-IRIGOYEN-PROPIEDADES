"use client";

import { logoutAction } from "@/app/admin/actions";
import { IconClose, IconMenu, IconProperties } from "@/components/admin/icons";
import { site } from "@/config/site";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

const AUTH_PREFIXES = ["/admin/login", "/admin/nueva-contrasena", "/admin/denegado"];

function isAuthScreen(pathname: string) {
  return AUTH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function propertiesActive(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/propiedades");
}

function SidebarContent({
  email,
  active,
  onNavigate,
}: {
  email: string;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="px-4 pt-4">
        <Link
          href="/admin"
          onClick={onNavigate}
          className="mx-auto flex w-fit rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155547]"
        >
          <Image
            src={site.logo.src}
            alt={site.logo.alt}
            width={site.logo.width}
            height={site.logo.height}
            sizes="112px"
            priority
            className="h-auto w-28 object-contain"
          />
        </Link>
        <p className="mt-1 text-center text-xs text-[#5c5854]">Administración</p>
      </div>
      <div className="mx-4 mt-4 border-t border-[#2a2a2a]/10" />
      <nav className="mt-3 px-3" aria-label="Administración">
        <Link
          href="/admin"
          aria-current={active ? "page" : undefined}
          onClick={onNavigate}
          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155547] ${
            active ? "font-medium text-[#155547]" : "text-[#2a2a2a]"
          }`}
          style={active ? { backgroundColor: "rgba(21, 85, 71, 0.14)" } : undefined}
        >
          <IconProperties />
          Propiedades
        </Link>
      </nav>
      <div className="mt-auto border-t border-[#efece6] px-4 py-4">
        <p className="truncate text-sm text-[#5c5854]" title={email}>
          {email}
        </p>
        <div className="mt-3 grid gap-2">
          <Link
            href="/"
            onClick={onNavigate}
            className="inline-flex h-8 items-center justify-center rounded-md border border-[#e4e0d8] bg-white px-3 text-sm text-[#155547] hover:bg-[#f6f3ed] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155547]"
          >
            Salir a la tienda
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex h-8 w-full items-center justify-center rounded-md border border-[#e4e0d8] bg-white px-3 text-sm text-[#5c5854] hover:bg-[#f6f3ed] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155547]"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function AdminShell({ email, children }: { email: string | null; children: ReactNode }) {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;
  const accountLabel = email || "Cuenta";
  const active = propertiesActive(pathname);

  if (!email || isAuthScreen(pathname)) {
    return children;
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f4f2ee] text-[#2a2a2a]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-[#e4e0d8] bg-white lg:flex">
        <SidebarContent email={accountLabel} active={active} onNavigate={() => setOpenPath(null)} />
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[#2a2a2a]/40"
            aria-label="Cerrar menú"
            onClick={() => setOpenPath(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menú"
            className="absolute inset-y-0 left-0 flex w-60 max-w-[85vw] flex-col bg-white shadow-[0_8px_24px_rgba(42,42,42,0.16)]"
          >
            <div className="flex justify-end px-3 pt-3">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#2a2a2a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155547]"
                aria-label="Cerrar menú"
                onClick={() => setOpenPath(null)}
              >
                <IconClose />
              </button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col">
              <SidebarContent email={accountLabel} active={active} onNavigate={() => setOpenPath(null)} />
            </div>
          </div>
        </div>
      ) : null}

      <div className="min-w-0 lg:pl-60">
        <div className="flex h-12 items-center border-b border-[#e4e0d8] bg-white px-4 lg:hidden">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#2a2a2a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155547]"
            aria-label="Abrir menú"
            aria-expanded={open}
            onClick={() => setOpenPath(pathname)}
          >
            <IconMenu />
          </button>
        </div>
        <main className="min-w-0 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">{children}</main>
      </div>
    </div>
  );
}
