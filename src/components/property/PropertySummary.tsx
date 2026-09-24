import {
  formatSquareMeters,
  propertyUsesBedrooms,
  type Property,
} from "@/data/properties";
import { IconWhatsApp } from "@/components/icons";
import { site } from "@/config/site";

export function propertyFacts(property: Property) {
  const facts: { label: string; value: string }[] = [];
  const isLot = property.type === "Lote";

  if (!isLot && property.rooms && property.rooms > 0) {
    facts.push({ label: "Ambientes", value: String(property.rooms) });
  }

  if (propertyUsesBedrooms(property.type)) {
    if (property.bedrooms > 0) {
      facts.push({ label: "Dormitorios", value: String(property.bedrooms) });
    }
    if (property.bathrooms > 0) {
      facts.push({ label: "Baños", value: String(property.bathrooms) });
    }
  } else if (!isLot && property.bathrooms > 0) {
    facts.push({ label: "Baños", value: String(property.bathrooms) });
  }

  if (property.garage && property.garage > 0) {
    facts.push({ label: "Cochera", value: String(property.garage) });
  }

  if (isLot) {
    if (property.landAreaM2 && property.landAreaM2 > 0) {
      facts.push({
        label: "Superficie del terreno",
        value: formatSquareMeters(property.landAreaM2),
      });
    }
  } else {
    if (property.coveredAreaM2 && property.coveredAreaM2 > 0) {
      facts.push({
        label: "Superficie cubierta",
        value: formatSquareMeters(property.coveredAreaM2),
      });
    }
    if (property.totalAreaM2 && property.totalAreaM2 > 0) {
      facts.push({
        label: "Superficie total",
        value: formatSquareMeters(property.totalAreaM2),
      });
    }
    if (property.landAreaM2 && property.landAreaM2 > 0) {
      facts.push({
        label: "Superficie del terreno",
        value: formatSquareMeters(property.landAreaM2),
      });
    }
  }

  return facts;
}

export function PropertyFacts({ property }: { property: Property }) {
  const facts = propertyFacts(property);
  if (facts.length === 0) {
    return null;
  }

  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-y border-linea py-5 sm:grid-cols-3">
      {facts.map((fact) => (
        <div key={fact.label} className="flex gap-3">
          <FactIcon label={fact.label} />
          <div>
            <dt className="text-xs text-muted">{fact.label}</dt>
            <dd className="mt-0.5 font-medium text-tinta tabular-nums">{fact.value}</dd>
          </div>
        </div>
      ))}
    </dl>
  );
}

export function PropertyInquiry({ whatsappHref }: { whatsappHref: string | null }) {
  return (
    <aside className="border-t border-linea pt-8 lg:border-t-0 lg:pt-0">
      <div className="lg:sticky lg:top-[calc(var(--header-offset)+1.25rem)] lg:border-l lg:border-linea lg:pl-8">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-verde">Contacto</p>
        <h2 className="mt-2 font-serif text-xl leading-tight text-verde-profundo">
          Consultá por esta propiedad
        </h2>
        <p className="mt-4 text-base text-tinta">{site.name}</p>
        {whatsappHref ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Consultar por WhatsApp al ${site.contact.whatsappDisplay}`}
            className="mt-6 flex items-center gap-4 border border-linea px-4 py-3 transition-colors hover:border-verde hover:bg-salvia-clara focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-verde text-white">
              <IconWhatsApp className="h-6 w-6" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs uppercase tracking-[0.16em] text-verde">WhatsApp</span>
              <span className="mt-0.5 block font-sans text-lg font-semibold tabular-nums text-verde-profundo">
                {site.contact.whatsappDisplay}
              </span>
            </span>
          </a>
        ) : null}
      </div>
    </aside>
  );
}

function FactIcon({ label }: { label: string }) {
  const common = {
    viewBox: "0 0 24 24",
    className: "mt-0.5 h-5 w-5 shrink-0 text-verde",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    "aria-hidden": true as const,
  };

  if (label === "Ambientes") {
    return (
      <svg {...common}>
        <path d="M4 10.5 12 4l8 6.5V20H4v-9.5z" />
        <path d="M10 20v-6h4v6" />
      </svg>
    );
  }
  if (label === "Dormitorios") {
    return (
      <svg {...common}>
        <path d="M3.5 17.5V12A2.5 2.5 0 0 1 6 9.5h12a2.5 2.5 0 0 1 2.5 2.5v5" />
        <path d="M3.5 14.5h17M6 9.5V7.8A1.8 1.8 0 0 1 7.8 6h2.4A1.8 1.8 0 0 1 12 7.8V9.5M12 9.5V7.8A1.8 1.8 0 0 1 13.8 6h2.4A1.8 1.8 0 0 1 18 7.8V9.5" />
      </svg>
    );
  }
  if (label === "Baños") {
    return (
      <svg {...common}>
        <path d="M6 11h12v3.5A5 5 0 0 1 13 19.5h-2A5 5 0 0 1 6 14.5V11z" />
        <path d="M8 11V7.5A2.5 2.5 0 0 1 10.5 5H11" />
      </svg>
    );
  }
  if (label === "Cochera") {
    return (
      <svg {...common}>
        <path d="M4 16.5V9.2L6.2 5.5h11.6L20 9.2v7.3" />
        <path d="M4 12.5h16M7 16.5v1.5M17 16.5v1.5" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <rect x="4" y="4" width="16" height="16" />
      <path d="M4 10h16M10 4v16" />
    </svg>
  );
}
