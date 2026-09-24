import Image from "next/image";
import Link from "next/link";
import { PropertyTitle } from "@/components/ui";
import type { Property } from "@/data/properties";

function displayPrice(price: string) {
  const digits = price.replace(/\D/g, "");
  if (!price.trim() || !digits || Number(digits) === 0) {
    return "Consultar";
  }
  return price;
}

export function PropertyCard({ property }: { property: Property }) {
  return (
    <article className="flex h-full flex-col bg-papel shadow-[0_12px_40px_rgba(12,51,46,0.08)]">
      <Link
        href={`/propiedades/${property.slug}`}
        className="flex h-full flex-col focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde"
      >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={property.image}
          alt={property.imageAlt}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        />
      </div>
      <div className="flex flex-1 flex-col px-5 py-5 sm:px-6">
        <p className="text-xs uppercase tracking-[0.16em] text-verde">
          {property.operation} · {property.type}
        </p>
        <h3 className="mt-2 font-serif text-2xl font-semibold text-verde-profundo">
          <PropertyTitle text={property.title} />
        </h3>
        <p className="mt-1 text-sm text-muted">{property.location}</p>
        <p className="mt-4 font-sans text-xl font-semibold tabular-nums tracking-tight text-verde">
          {displayPrice(property.price)}
        </p>
        <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-linea pt-4 text-center text-sm text-muted">
          <div>
            <dt className="text-[0.7rem] uppercase tracking-wider">Dorm.</dt>
            <dd className="mt-1 font-sans tabular-nums text-tinta">
              {property.bedrooms}
            </dd>
          </div>
          <div>
            <dt className="text-[0.7rem] uppercase tracking-wider">Baños</dt>
            <dd className="mt-1 font-sans tabular-nums text-tinta">
              {property.bathrooms}
            </dd>
          </div>
          <div>
            <dt className="text-[0.7rem] uppercase tracking-wider">Superficie</dt>
            <dd className="mt-1 font-sans tabular-nums text-tinta">
              {property.area}
            </dd>
          </div>
        </dl>
      </div>
      </Link>
    </article>
  );
}
