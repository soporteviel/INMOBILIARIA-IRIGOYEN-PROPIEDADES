import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminProviders } from "@/components/admin/AdminProviders";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAuthState } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Administración",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const auth = await getAuthState();
  const email = auth.status === "authenticated" && auth.isAdmin ? auth.email || "Administrador" : null;

  return (
    <AdminProviders>
      <AdminShell email={email}>{children}</AdminShell>
    </AdminProviders>
  );
}
