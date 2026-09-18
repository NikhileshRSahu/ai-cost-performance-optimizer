import Link from 'next/link';
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { LaunchUiHomeHero } from '../components/marketing/launch-ui-home';
import { LandingProductPreview } from '../components/marketing/landing-product-preview';

export default function HomePage() {
  return (
    <div className="bg-[#050510]">
      <LaunchUiHomeHero />
      <LandingProductPreview />

      <section className="relative overflow-hidden border-t border-white/[0.06] bg-[#050510] px-4 py-16 text-white sm:py-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[-12rem] left-1/2 h-80 w-[70%] -translate-x-1/2 rounded-full bg-violet-500/15 blur-[120px]"
        />
        <div className="relative mx-auto w-[min(1180px,100%)] overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.018] p-6 shadow-[inset_0_1px_rgba(255,255,255,.04)] sm:p-9 lg:p-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/15 bg-violet-300/[0.05] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-violet-200">
                <Sparkles className="size-3.5" />
                Start with one source
              </div>
              <h2 className="mt-5 max-w-[760px] text-[clamp(2.4rem,5vw,4.8rem)] font-semibold leading-[0.95] tracking-[-0.058em]">
                See what your AI usage is costing you — and what is safe to change.
              </h2>
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-white/42">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-emerald-300" />
                  No credit card
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-sky-300" />
                  Evidence before savings claims
                </span>
              </div>
            </div>

            <Link
              href="/start"
              className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 no-underline shadow-[0_14px_40px_rgba(255,255,255,.10)] transition hover:-translate-y-0.5 hover:bg-violet-100"
            >
              Analyze my AI usage <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
