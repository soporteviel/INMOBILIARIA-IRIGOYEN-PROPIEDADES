export type NavItem = {
  label: string;
  href: string;
};

export const site = {
  name: "Noelia Irigoyen Propiedades",
  shortName: "Noelia Irigoyen",
  profession: "Martillera y Corredora Pública",
  license: "Mat. 7.813 CMCPDJLP",
  description:
    "Noelia Irigoyen Propiedades brinda un servicio inmobiliario profesional y personalizado, orientado a acompañar a sus clientes en cada etapa de los procesos de compra, venta y alquiler.",
  logo: {
    src: "/brand/logo.png",
    alt: "Noelia Irigoyen Propiedades",
    width: 1254,
    height: 1254,
  },
  logoOnDark: {
    src: "/brand/logo-claro.png",
    alt: "Noelia Irigoyen Propiedades",
    width: 1254,
    height: 1254,
  },
  nav: [
    { label: "Inicio", href: "/#inicio" },
    { label: "Propiedades", href: "/propiedades" },
    { label: "Tasaciones", href: "/#tasaciones" },
    { label: "Nosotros", href: "/#nosotros" },
    { label: "Contacto", href: "/#contacto" },
  ] satisfies NavItem[],
  contact: {
    phoneDisplay: "15-3884-9033",
    phoneHref: "tel:+541138849033",
    email: "irigoyen.propiedades@hotmail.com",
    instagramHandle: "Irigoyen.propiedades",
    instagramUrl: "https://www.instagram.com/Irigoyen.propiedades/",
    /**
     * Número internacional para WhatsApp, a partir del celular de la tarjeta.
     * El código de área 11 se infiere del formato 15 + 8 dígitos; confirmar.
     * Dejar vacío para ocultar el botón flotante y el enlace de WhatsApp.
     */
    whatsappNumber: "5491138849033",
    whatsappDisplay: "15-3884-9033",
  },
  developer: {
    name: "VIEL",
    url: "https://viel.ar",
    logo: "/brand/viel-mark.png",
  },
  /**
   * Formulario 960. El código qr lo emitió AFIP para esta contribuyente.
   * La imagen se pide por HTTPS para que el sello cargue en el sitio público.
   */
  afip: {
    href: "https://serviciosweb.afip.gob.ar/clavefiscal/qr/response.aspx?qr=TNexOQjKzkWWH5Vor6YIsA,,",
    image: "https://www.afip.gob.ar/images/f960/DATAWEB.jpg",
    label: "Data Fiscal AFIP",
  },
} as const;

export function isConfigured(value: string | undefined | null): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function whatsappLink(message?: string) {
  if (!isConfigured(site.contact.whatsappNumber)) {
    return null;
  }

  const url = new URL(`https://wa.me/${site.contact.whatsappNumber}`);
  if (message) {
    url.searchParams.set("text", message);
  }
  return url.toString();
}
