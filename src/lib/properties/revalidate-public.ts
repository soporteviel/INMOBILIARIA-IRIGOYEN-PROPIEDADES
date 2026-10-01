import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";
import { devTiming } from "@/lib/dev/timing";
import { createClient } from "@/lib/supabase/server";

export const PUBLIC_CATALOG_TAG = "public-catalog";

/**
 * Marca el catálogo y las rutas públicas como vencidos.
 * `revalidatePath` y `revalidateTag` no reconstruyen esas páginas acá:
 * la visita siguiente hace el trabajo. La consulta del slug solo ocurre
 * si el llamador no lo tiene.
 */
export async function revalidatePublicViews(input: {
  propertyId?: string;
  slug?: string | null;
  previousSlug?: string | null;
} = {}) {
  const started = performance.now();
  let slug = input.slug ?? null;
  if (!slug && input.propertyId) {
    const lookup = performance.now();
    const supabase = await createClient();
    if (supabase) {
      const { data } = await supabase.from("properties").select("slug").eq("id", input.propertyId).maybeSingle();
      slug = typeof data?.slug === "string" ? data.slug : null;
    }
    devTiming("invalidacion-publica", "consulta-slug", lookup);
  }

  const marked = performance.now();
  revalidateTag(PUBLIC_CATALOG_TAG, { expire: 0 });
  revalidatePath("/");
  revalidatePath("/propiedades");
  const slugs = new Set(
    [slug, input.previousSlug ?? null].filter((value): value is string => Boolean(value)),
  );
  for (const item of slugs) {
    revalidatePath(`/propiedades/${item}`);
  }
  devTiming("invalidacion-publica", "marcas", marked, slugs.size > 0 ? [...slugs].join(",") : "sin-slug");
  devTiming("invalidacion-publica", "total", started);
}
