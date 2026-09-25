"use client";

import { logoutAction } from "@/app/admin/actions";
import { IconChevron } from "@/components/admin/icons";
import { site } from "@/config/site";
import { Dropdown } from "antd";
import Image from "next/image";
import Link from "next/link";
import { useRef, type ReactNode } from "react";

export function AdminShell({ email, children }: { email: string; children: ReactNode }) {
  const logoutRef = useRef<HTMLFormElement>(null);
  const accountLabel = email || "Cuenta";

  return (
    <div className="min-h-screen overflow-x-clip bg-[#f6f3ed] text-[#2a2a2a]">
      <header className="border-b border-[#e4e0d8] bg-white">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-3 px-5 sm:gap-4 sm:px-8">
          <Link href="/admin" className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155547]">
            <Image
              src={site.logo.src}
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
            />
            <span className="truncate text-base font-medium">Administración</span>
          </Link>
          <Link
            href="/"
            className="ml-auto shrink-0 rounded-md text-[15px] text-[#155547] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155547]"
          >
            Ver sitio
          </Link>
          <form ref={logoutRef} action={logoutAction}>
            <Dropdown
              trigger={["click"]}
              menu={{
                items: [
                  {
                    key: "logout",
                    label: "Cerrar sesión",
                    onClick: () => logoutRef.current?.requestSubmit(),
                  },
                ],
              }}
            >
              <button
                type="button"
                className="inline-flex h-10 min-w-0 max-w-[9rem] shrink items-center gap-1 rounded-lg border border-[#e4e0d8] bg-white px-3 text-sm text-[#2a2a2a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155547] sm:max-w-[16rem]"
                aria-label={`Menú de ${accountLabel}`}
                title={accountLabel}
              >
                <span className="truncate">{accountLabel}</span>
                <IconChevron />
              </button>
            </Dropdown>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1280px] px-5 pt-6 pb-28 sm:px-8 sm:pt-8">
        <p className="mb-6 max-w-3xl text-[15px] leading-relaxed text-[#5c5854]">
          Los cambios de este panel todavía no se ven en el sitio público. La carga de fotos sigue pendiente.
        </p>
        {children}
      </main>
    </div>
  );
}
