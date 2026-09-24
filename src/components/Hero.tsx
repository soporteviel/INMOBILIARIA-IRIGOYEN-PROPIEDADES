"use client";

import { useEffect, useRef, useState } from "react";
import { HeroSearch } from "@/components/HeroSearch";
import { IconPause, IconPlay } from "@/components/icons";
import { Container } from "@/components/ui";

const POSTER = "/videos/hero-poster.jpg";
const VIDEO_SRC = "/videos/hero.mp4";

export function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [allowVideo, setAllowVideo] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [playbackFailed, setPlaybackFailed] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");

    function syncPreference() {
      setAllowVideo(!media.matches);
      if (media.matches) {
        setPlaying(false);
      }
    }

    syncPreference();
    media.addEventListener("change", syncPreference);
    return () => media.removeEventListener("change", syncPreference);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!allowVideo || !video || playbackFailed) {
      return;
    }

    const playPromise = video.play();
    if (playPromise) {
      playPromise
        .then(() => setPlaying(true))
        .catch(() => {
          setPlaybackFailed(true);
          setPlaying(false);
        });
    }
  }, [allowVideo, playbackFailed]);

  async function togglePlayback() {
    const video = videoRef.current;
    if (!video || playbackFailed) {
      return;
    }

    if (video.paused) {
      try {
        await video.play();
        setPlaying(true);
      } catch {
        setPlaybackFailed(true);
        setPlaying(false);
      }
      return;
    }

    video.pause();
    setPlaying(false);
  }

  return (
    <section
      id="inicio"
      className="relative z-20 overflow-visible bg-verde-oscuro text-papel"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${POSTER})` }}
        />

        {allowVideo && !playbackFailed ? (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            poster={POSTER}
            muted
            loop
            playsInline
            preload="metadata"
            onPlaying={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onError={() => {
              setPlaybackFailed(true);
              setPlaying(false);
            }}
          >
            <source src={VIDEO_SRC} type="video/mp4" />
          </video>
        ) : null}

        <div className="absolute inset-0 bg-verde-oscuro/45" />
      </div>

      <Container className="relative z-10 flex flex-col items-center justify-center px-5 py-14 sm:py-16 lg:min-h-[calc(100svh-var(--header-offset))] lg:py-12">
        <div className="flex w-full max-w-4xl flex-col items-center gap-6">
          <h1 className="max-w-xl text-center font-serif text-[1.75rem] font-semibold leading-snug text-papel lg:text-[2.5rem] lg:leading-[1.2]">
            Encontrá tu próxima propiedad
          </h1>

          <HeroSearch />
        </div>
      </Container>

      {allowVideo && !playbackFailed ? (
        <button
          type="button"
          onClick={togglePlayback}
          className="absolute right-4 bottom-4 z-20 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/30 bg-verde-oscuro/55 text-papel transition-colors hover:bg-verde-oscuro/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-papel sm:right-6 sm:bottom-6"
          aria-label={playing ? "Pausar video de fondo" : "Reanudar video de fondo"}
        >
          {playing ? <IconPause /> : <IconPlay />}
        </button>
      ) : null}
    </section>
  );
}
