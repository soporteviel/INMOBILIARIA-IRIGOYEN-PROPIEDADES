import type { MetadataRoute } from "next";
import { getPublishedCatalog } from "@/lib/properties/public-catalog";
import { getSiteUrl } from "@/lib/supabase/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const catalog = await getPublishedCatalog();
  const properties = catalog.ok ? catalog.properties : [];

  return [
    { url: siteUrl },
    { url: `${siteUrl}/propiedades` },
    ...properties.map((property) => ({
      url: `${siteUrl}/propiedades/${property.slug}`,
    })),
  ];
}
