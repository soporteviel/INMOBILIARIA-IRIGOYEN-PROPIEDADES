import { NextResponse } from "next/server";
import { devTiming } from "@/lib/dev/timing";
import { getAuthState } from "@/lib/auth/session";
import { listAdminLocations } from "@/lib/properties/repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const started = performance.now();
  const auth = await getAuthState();
  devTiming("ubicaciones", "auth", started);
  if (auth.status !== "authenticated" || !auth.isAdmin || auth.mustChangePassword) {
    return NextResponse.json({ message: "Tenés que iniciar sesión." }, { status: 401 });
  }
  const query = performance.now();
  const locations = await listAdminLocations();
  devTiming("ubicaciones", "consulta", query);
  devTiming("ubicaciones", "total", started);
  if (!locations.ok) {
    return NextResponse.json({ message: locations.message }, { status: 500 });
  }
  return NextResponse.json(
    { names: locations.names },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
