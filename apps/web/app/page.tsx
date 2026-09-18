import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CinematicVideoHero } from '../components/marketing/cinematic-video-hero';
import { LandingProductPreview } from '../components/marketing/landing-product-preview';

export default function HomePage() {
  return (
    <div className="bg-[#050510]">
      <CinematicVideoHero />
      <LandingProductPreview />

      <section className="border-t border-white/[0.06] bg-[#050510] py-12 text-white">
        <div className="mx-auto flex w-[min(1320px,calc(100%-2rem))] flex-col gap-5 rounded-[24px] border border-white/[0.07] bg-white/[0.025] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-200/55">
              Ready to see your own data?
            </p>
            <h2 className="m-0 mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
              Give Evalomics one usage source.
            </h2>
          </div>
          <Link
            href="/start"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 no-underline transition hover:-translate-y-0.5 hover:bg-violet-100"
          >
            Analyze my AI usage <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
