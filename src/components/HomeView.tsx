import { About } from "@/components/About";
import { Contact } from "@/components/Contact";
import { FeaturedProperties } from "@/components/FeaturedProperties";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Valuation } from "@/components/Valuation";
import { emptyPropertyFilterOptions, getPropertyFilterOptions } from "@/data/properties";
import { getPublishedCatalog } from "@/lib/properties/public-catalog";

export async function HomeView() {
  const catalog = await getPublishedCatalog();
  const options = catalog.ok ? getPropertyFilterOptions(catalog.properties) : emptyPropertyFilterOptions();
  const featured = catalog.ok ? catalog.properties.filter((property) => property.featured) : [];

  return (
    <>
      <Header variant="overlay" />
      <main id="contenido">
        <Hero underHeader searchOptions={options} />
        <FeaturedProperties
          properties={featured}
          error={catalog.ok ? null : catalog.message}
          photosUnavailable={catalog.ok && catalog.photosUnavailable}
        />
        <Valuation />
        <About />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
