import { About } from "@/components/About";
import { Contact } from "@/components/Contact";
import { FeaturedProperties } from "@/components/FeaturedProperties";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Valuation } from "@/components/Valuation";

export default function Home() {
  return (
    <>
      <Header />
      <main id="contenido">
        <Hero />
        <FeaturedProperties />
        <Valuation />
        <About />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
