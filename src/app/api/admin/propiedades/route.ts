import { devTiming } from "@/lib/dev/timing";
import { savePropertyRecord } from "@/lib/properties/save-property";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const started = performance.now();
  const body = await request.json().catch(() => null);
  const result = await savePropertyRecord(body);
  devTiming("guardar", "respuesta-servidor", started, result.ok ? result.status : "error");
  return NextResponse.json(result, {
    status: result.ok ? 200 : 400,
    headers: { "Cache-Control": "private, no-store" },
  });
}
