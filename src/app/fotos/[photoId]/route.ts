import { NextResponse } from "next/server";
import { imageContentType } from "@/lib/photos/kind";
import { readObject, r2ConfigError } from "@/lib/r2/client";
import { createPublicClient } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RouteContext = { params: Promise<{ photoId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const photoId = (await context.params).photoId;
  if (!UUID_RE.test(photoId)) {
    return new NextResponse(null, { status: 404 });
  }

  const supabase = createPublicClient();
  if (!supabase) {
    return new NextResponse(null, { status: 503 });
  }

  const { data, error } = await supabase
    .from("property_photos")
    .select("object_key, properties!inner(status)")
    .eq("id", photoId)
    .eq("status", "ready")
    .eq("properties.status", "PUBLICADA")
    .maybeSingle();

  if (error || !data || typeof data.object_key !== "string" || !data.object_key) {
    return new NextResponse(null, { status: 404 });
  }

  if (r2ConfigError()) {
    return new NextResponse(null, { status: 503 });
  }

  try {
    const object = await readObject(data.object_key);
    const contentType = imageContentType(object.bytes);
    if (!contentType) {
      return new NextResponse(null, { status: 404 });
    }
    return new NextResponse(new Uint8Array(object.bytes), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=60",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
