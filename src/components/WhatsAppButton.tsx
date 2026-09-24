import { IconWhatsApp } from "@/components/icons";
import { whatsappLink } from "@/config/site";

export function WhatsAppButton() {
  const href = whatsappLink(
    "Hola, quería hacer una consulta sobre una propiedad.",
  );

  if (!href) {
    return null;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed right-5 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-50 flex h-14 w-14 items-center justify-center rounded-full bg-verde text-papel shadow-[0_8px_24px_rgba(12,51,46,0.28)] transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde"
      aria-label="Escribir por WhatsApp"
    >
      <IconWhatsApp className="h-7 w-7" />
    </a>
  );
}
