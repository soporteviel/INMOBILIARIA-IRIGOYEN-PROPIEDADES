import { About } from "@/components/About";
import { Contact } from "@/components/Contact";
import { FeaturedProperties } from "@/components/FeaturedProperties";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Valuation } from "@/components/Valuation";

export function HomeView({ variant = "overlay" }: { variant?: "solid" | "overlay" }) {
  return (
    <>
      <Header variant={variant} homePath={variant === "solid" ? "/opcion-2" : "/"} />
      <main id="contenido">
        <Hero underHeader={variant === "overlay"} />
        <FeaturedProperties />
        <Valuation />
        <About />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
