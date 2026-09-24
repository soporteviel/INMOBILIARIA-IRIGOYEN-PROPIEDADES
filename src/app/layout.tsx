import type { Metadata } from "next";
import { Cormorant_Garamond, Source_Sans_3 } from "next/font/google";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { site } from "@/config/site";
import "./globals.css";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: site.name,
  description: `${site.profession}. ${site.description}`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-AR"
      data-scroll-behavior="smooth"
      className={`${serif.variable} ${sans.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-crema font-sans text-tinta">
        {children}
        <WhatsAppButton />
      </body>
    </html>
  );
}
