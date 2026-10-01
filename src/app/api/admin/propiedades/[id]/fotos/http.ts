import { NextResponse } from "next/server";
import type { PhotoError } from "@/lib/photos/repository";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export function photoError(error: PhotoError) {
  return json({ message: error.message }, error.status);
}

export function readPropertyId(id: string) {
  if (!UUID_RE.test(id)) {
    return null;
  }
  return id;
}

export async function readJson(request: Request) {
  try {
    return (await request.json()) as unknown;
  } catch {
    return null;
  }
}
