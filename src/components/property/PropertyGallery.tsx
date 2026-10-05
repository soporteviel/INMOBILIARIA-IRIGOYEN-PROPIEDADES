"use client";

import Image, { getImageProps } from "next/image";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { PropertyPhoto } from "@/data/properties";

type PropertyGalleryProps = {
  photos: PropertyPhoto[];
  emptyLabel?: string;
};

function EmptyGallery({ label }: { label: string }) {
  return (
    <div className="flex h-[clamp(280px,42vw,520px)] items-center justify-center border border-linea bg-salvia-clara">
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}

function cellClass(total: number, index: number) {
  if (total === 3 && index === 0) {
    return "row-span-2";
  }
  if (total === 4 && index === 0) {
    return "row-span-3";
  }
  if (total >= 5 && index === 0) {
    return "col-span-2 row-span-2";
  }
  return "";
}

function gridClass(total: number) {
  if (total <= 1) {
    return "grid-cols-1 grid-rows-1";
  }
  if (total === 2) {
    return "grid-cols-2 grid-rows-1";
  }
  if (total === 3) {
    return "grid-cols-2 grid-rows-2";
  }
  if (total === 4) {
    return "grid-cols-2 grid-rows-3";
  }
  return "grid-cols-4 grid-rows-2";
}

const LIGHTBOX_SIZES = "100vw";
const THUMB_SIZES = "96px";

function desktopSlot(fraction: "full" | "half" | "quarter") {
  if (fraction === "full") {
    return "(min-width: 1024px) min(72rem, 100vw), 100vw";
  }
  if (fraction === "half") {
    return "(min-width: 1024px) min(36rem, 50vw), 50vw";
  }
  return "(min-width: 1024px) min(18rem, 25vw), 25vw";
}

function gridSizes(total: number, index: number) {
  if (total <= 1) {
    return desktopSlot("full");
  }
  if (total >= 5) {
    return desktopSlot(index === 0 ? "half" : "quarter");
  }
  return desktopSlot("half");
}

function OptimizedPreload({
  src,
  sizes,
  media,
  fetchPriority = "auto",
}: {
  src: string;
  sizes: string;
  media?: string;
  fetchPriority?: "high" | "low" | "auto";
}) {
  const { props } = getImageProps({ alt: "", src, fill: true, sizes });
  return (
    <link
      rel="preload"
      as="image"
      media={media}
      fetchPriority={fetchPriority}
      imageSrcSet={props.srcSet}
      imageSizes={props.sizes}
      href={props.srcSet ? undefined : props.src}
    />
  );
}

export function PropertyGallery({ photos, emptyLabel = "Sin fotos" }: PropertyGalleryProps) {
  if (photos.length === 0) {
    return <EmptyGallery label={emptyLabel} />;
  }
  return <PropertyGalleryView photos={photos} />;
}

function PropertyGalleryView({ photos }: { photos: PropertyPhoto[] }) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const thumbRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const swipeRef = useRef<{ x: number; y: number } | null>(null);
  const stripSwipeRef = useRef<{ x: number; y: number } | null>(null);
  const ignoreStripScroll = useRef(false);
  const suppressSlideClick = useRef(false);
  const titleId = useId();
  const total = photos.length;
  const visible = photos.slice(0, total >= 5 ? 5 : total);
  const showAll = total > visible.length;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      openerRef.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setIndex((current) => (current + 1) % total);
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setIndex((current) => (current - 1 + total) % total);
        return;
      }
      if (event.key !== "Tab") {
        return;
      }
      const dialog = dialogRef.current;
      if (!dialog) {
        return;
      }
      const nodes = [
        ...dialog.querySelectorAll<HTMLElement>("button, [href], [tabindex]:not([tabindex='-1'])"),
      ].filter(
        (node) => !node.hasAttribute("disabled") && node.getClientRects().length > 0,
      );
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (!first || !last) {
        return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, total]);

  useEffect(() => {
    if (!open) {
      return;
    }
    thumbRefs.current[index]?.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }, [index, open, reducedMotion]);

  function openAt(nextIndex: number, opener: HTMLElement) {
    openerRef.current = opener;
    setIndex(nextIndex);
    setOpen(true);
  }

  function step(delta: number) {
    setIndex((current) => (current + delta + total) % total);
  }

  function scrollToSlide(nextIndex: number) {
    setIndex((nextIndex + total) % total);
  }

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || open || scroller.clientWidth === 0) {
      return;
    }
    const target = index * scroller.clientWidth;
    if (Math.abs(scroller.scrollLeft - target) < 2) {
      return;
    }
    ignoreStripScroll.current = true;
    scroller.scrollTo({ left: target, behavior: "auto" });
    const release = () => {
      ignoreStripScroll.current = false;
    };
    scroller.addEventListener("scrollend", release, { once: true });
    const fallback = window.setTimeout(release, reducedMotion ? 0 : 450);
    return () => {
      ignoreStripScroll.current = false;
      scroller.removeEventListener("scrollend", release);
      window.clearTimeout(fallback);
    };
  }, [index, open, reducedMotion]);

  function onStripScroll() {
    if (ignoreStripScroll.current) {
      return;
    }
    const scroller = scrollerRef.current;
    if (!scroller || scroller.clientWidth === 0) {
      return;
    }
    const next = Math.round(scroller.scrollLeft / scroller.clientWidth);
    const clamped = Math.min(total - 1, Math.max(0, next));
    setIndex((current) => (current === clamped ? current : clamped));
  }

  function onStripPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse") {
      return;
    }
    stripSwipeRef.current = { x: event.clientX, y: event.clientY };
  }

  function onStripPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const start = stripSwipeRef.current;
    stripSwipeRef.current = null;
    if (!start || event.pointerType === "mouse") {
      return;
    }
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < 48 || Math.abs(dx) <= Math.abs(dy)) {
      return;
    }
    suppressSlideClick.current = true;
    scrollToSlide((index + (dx < 0 ? 1 : -1) + total) % total);
  }

  function onSlideClick(photoIndex: number, opener: HTMLElement) {
    if (suppressSlideClick.current) {
      suppressSlideClick.current = false;
      return;
    }
    openAt(photoIndex, opener);
  }

  function onLightboxPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    swipeRef.current = { x: event.clientX, y: event.clientY };
  }

  function onLightboxPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const start = swipeRef.current;
    swipeRef.current = null;
    if (!start) {
      return;
    }
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) {
      return;
    }
    step(dx < 0 ? 1 : -1);
  }

  const current = photos[index] ?? photos[0];
  const first = photos[0];

  return (
    <>
      {photos.map((photo, photoIndex) => (
        <OptimizedPreload
          key={photo.id}
          src={photo.src}
          sizes={LIGHTBOX_SIZES}
          fetchPriority={photoIndex === 0 ? "high" : "low"}
        />
      ))}
      {first ? (
        <OptimizedPreload
          src={first.src}
          sizes={gridSizes(visible.length, 0)}
          media="(min-width: 1024px)"
          fetchPriority="high"
        />
      ) : null}
      <div className={`hidden h-[clamp(420px,42vw,520px)] gap-2 lg:grid ${gridClass(visible.length)}`}>
        {visible.map((photo, photoIndex) => {
          const isLast = photoIndex === visible.length - 1;
          return (
            <div
              key={photo.id}
              className={`relative min-h-0 overflow-hidden border border-linea bg-salvia-clara ${cellClass(visible.length, photoIndex)}`}
            >
              <button
                type="button"
                className="absolute inset-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-verde"
                onClick={(event) => openAt(photoIndex, event.currentTarget)}
                aria-label={`Ampliar ${photo.alt}`}
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  loading="lazy"
                  sizes={gridSizes(visible.length, photoIndex)}
                  className="object-cover"
                />
              </button>
              {showAll && isLast ? (
                <button
                  type="button"
                  className="absolute right-3 bottom-3 z-10 cursor-pointer bg-verde-oscuro/80 px-3 py-2 text-sm text-papel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-papel"
                  onClick={(event) => openAt(0, event.currentTarget)}
                >
                  Ver las {total} fotos
                </button>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="lg:hidden">
        <div className="relative aspect-[4/3] overflow-hidden border border-linea bg-salvia-clara">
          <div
            ref={scrollerRef}
            className="flex h-full snap-x snap-mandatory touch-pan-y overflow-x-auto overscroll-x-contain"
            onScroll={onStripScroll}
            onPointerDown={onStripPointerDown}
            onPointerUp={onStripPointerUp}
          >
            {photos.map((photo, photoIndex) => (
              <button
                key={photo.id}
                type="button"
                className="relative h-full min-w-full shrink-0 snap-center cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-verde"
                onClick={(event) => onSlideClick(photoIndex, event.currentTarget)}
                aria-label={`Ampliar ${photo.alt}`}
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  loading="eager"
                  sizes={LIGHTBOX_SIZES}
                  className="object-cover"
                />
              </button>
            ))}
          </div>
          {total > 1 ? (
            <>
              <button
                type="button"
                className="absolute top-1/2 left-3 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center bg-verde-oscuro/70 text-papel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-papel"
                aria-label="Foto anterior"
                onClick={() => scrollToSlide((index - 1 + total) % total)}
              >
                <Chevron direction="left" />
              </button>
              <button
                type="button"
                className="absolute top-1/2 right-3 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center bg-verde-oscuro/70 text-papel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-papel"
                aria-label="Foto siguiente"
                onClick={() => scrollToSlide((index + 1) % total)}
              >
                <Chevron direction="right" />
              </button>
              <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 bg-verde-oscuro/75 px-2.5 py-1 text-xs tabular-nums text-papel">
                {index + 1} / {total}
              </p>
            </>
          ) : null}
        </div>
      </div>

      {open && current ? (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="fixed inset-0 z-[70] flex flex-col bg-verde-oscuro text-papel"
        >
          <p id={titleId} className="sr-only">
            Galería de fotos
          </p>
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <p className="text-sm tabular-nums">
              {index + 1} / {total}
            </p>
            <button
              ref={closeRef}
              type="button"
              className="inline-flex h-11 cursor-pointer items-center px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-papel"
              onClick={() => setOpen(false)}
            >
              Cerrar
            </button>
          </div>

          <div
            className="relative min-h-0 flex-1"
            onPointerDown={onLightboxPointerDown}
            onPointerUp={onLightboxPointerUp}
          >
            <Image
              src={current.src}
              alt={current.alt}
              fill
              sizes={LIGHTBOX_SIZES}
              className="object-contain"
            />
            {total > 1 ? (
              <>
                <button
                  type="button"
                  className="absolute top-1/2 left-3 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center border border-white/25 bg-verde-oscuro/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-papel sm:left-6"
                  aria-label="Foto anterior"
                  onClick={() => step(-1)}
                >
                  <Chevron direction="left" />
                </button>
                <button
                  type="button"
                  className="absolute top-1/2 right-3 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center border border-white/25 bg-verde-oscuro/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-papel sm:right-6"
                  aria-label="Foto siguiente"
                  onClick={() => step(1)}
                >
                  <Chevron direction="right" />
                </button>
              </>
            ) : null}
          </div>

          {total > 1 ? (
            <div className="hidden gap-2 overflow-x-auto px-6 py-4 lg:flex">
              {photos.map((photo, photoIndex) => {
                const selected = photoIndex === index;
                return (
                  <button
                    key={photo.id}
                    ref={(node) => {
                      thumbRefs.current[photoIndex] = node;
                    }}
                    type="button"
                    aria-label={photo.alt}
                    aria-current={selected ? "true" : undefined}
                    className={`relative h-16 w-24 shrink-0 cursor-pointer overflow-hidden border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-papel ${
                      selected ? "border-papel" : "border-white/20 opacity-70"
                    }`}
                    onClick={() => setIndex(photoIndex)}
                  >
                    <Image
                      src={photo.src}
                      alt=""
                      fill
                      loading="lazy"
                      sizes={THUMB_SIZES}
                      className="object-cover"
                    />
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      {direction === "left" ? <path d="M10 3.5 5.5 8 10 12.5" /> : <path d="M6 3.5 10.5 8 6 12.5" />}
    </svg>
  );
}
