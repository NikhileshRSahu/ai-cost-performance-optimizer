'use client';

import Link from 'next/link';
import { Pause, Play, VolumeX } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

const REFERENCE_VIDEO =
  'https://d2ol7oe51mr4n9.cloudfront.net/user_3JOZbCBwNL9bBW0BUCVzdU7w8RP/246308ff-d935-40b4-ad14-f81dd559de82.mp4';

export function CinematicVideoHero() {
  const reduceMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(reduceMotion !== true);

  useEffect(() => {
    const video = videoRef.current;
    if (video === null) return;

    if (reduceMotion) {
      video.pause();
      setPlaying(false);
      return;
    }

    void video.play().then(
      () => {
        setPlaying(true);
      },
      () => {
        setPlaying(false);
      },
    );
  }, [reduceMotion]);

  function togglePlayback() {
    const video = videoRef.current;
    if (video === null) return;

    if (video.paused) {
      void video.play().then(() => {
        setPlaying(true);
      });
    } else {
      video.pause();
      setPlaying(false);
    }
  }

  return (
    <section className="overflow-hidden bg-[#050510] text-white">
      <div className="mx-auto w-[min(1540px,100%)] px-3 pt-3 sm:px-5 sm:pt-5">
        <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-black shadow-[0_40px_120px_rgba(11,7,37,.48)]">
          <video
            ref={videoRef}
            className="aspect-video w-full bg-black object-contain"
            src={REFERENCE_VIDEO}
            muted
            playsInline
            loop
            preload="metadata"
            aria-label="Cinematic Evalomics motion reference supplied by the product owner"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/55 to-transparent" />
          <div className="absolute bottom-4 right-4 flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-black/45 px-3 py-2 text-[10px] font-semibold text-white/55 backdrop-blur sm:inline-flex">
              <VolumeX className="size-3.5" />
              muted
            </span>
            <button
              type="button"
              onClick={togglePlayback}
              className="grid size-10 place-items-center rounded-full border border-white/12 bg-black/55 text-white/80 backdrop-blur transition hover:bg-white hover:text-slate-950"
              aria-label={
                playing ? 'Pause landing animation' : 'Play landing animation'
              }
            >
              {playing ? (
                <Pause className="size-4" />
              ) : (
                <Play className="size-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-[min(1320px,calc(100%-2rem))] gap-6 py-9 sm:py-12 lg:grid-cols-[1.05fr_.95fr] lg:items-end">
        <div>
          <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-200/60">
            AI cost intelligence
          </p>
          <h1 className="mt-4 max-w-[9ch] text-[clamp(3.2rem,7vw,7rem)] font-semibold leading-[.88] tracking-[-.075em] text-white">
            See the waste.
            <span className="block text-white/52">Act on the proof.</span>
          </h1>
        </div>
        <div className="lg:pb-2">
          <p className="m-0 max-w-xl text-sm leading-6 text-white/52 sm:text-base sm:leading-7">
            Connect OpenAI or Anthropic, or upload a usage CSV. Evalomics turns
            the evidence into a cost dashboard, ranked recommendations, and
            verified savings without pretending modeled savings are achieved.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/start"
              className="inline-flex min-h-12 items-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 no-underline transition hover:-translate-y-0.5 hover:bg-violet-100"
            >
              Analyze my AI usage
            </Link>
            <Link
              href="/demo"
              className="inline-flex min-h-12 items-center rounded-xl border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white no-underline transition hover:bg-white/[0.08]"
            >
              Try the live demo
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
