import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { CostPerOutcomeCalculator } from '../../../components/cost-per-outcome-calculator';

export const metadata: Metadata = {
  title: 'Cost per Successful Outcome Calculator | Evalomics',
  description:
    'Estimate the economic cost of a successful AI outcome from monthly cost, request volume, and your measured success rate.',
};

export default function Page() {
  return (
    <div className="grid gap-12 pb-8 sm:gap-14">
      <section
        className="max-w-4xl pt-4 sm:pt-8"
        aria-labelledby="calculator-title"
      >
        <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-200/75">
          Free tool · no login
        </p>
        <h1
          id="calculator-title"
          className="mt-4 !text-[clamp(3.2rem,7vw,6.4rem)] !leading-[.9] !tracking-[-.07em] text-white"
        >
          Cost per outcome,
          <span className="block text-white/45">
            not just cost per request.
          </span>
        </h1>
        <p className="mt-7 max-w-2xl text-base leading-7 text-white/45">
          Use your measured success rate to see what one successful AI outcome
          actually costs. Currency conversion is explicit, timestamped, and
          withheld if a reference rate cannot be loaded.
        </p>
      </section>

      <CostPerOutcomeCalculator />

      <section className="eval-glass-card grid gap-7 rounded-[24px] p-6 sm:p-8 lg:grid-cols-[.92fr_1.08fr] lg:items-center">
        <div>
          <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-orange-200/75">
            Reliability changes economics
          </p>
          <h2 className="mt-3 !text-[clamp(2rem,4vw,3.5rem)] !leading-[.98] !tracking-[-.05em] text-white">
            A cheaper request
            <span className="block text-white/45">
              can still be a worse outcome.
            </span>
          </h2>
        </div>
        <div>
          <p className="m-0 max-w-2xl text-sm leading-6 text-white/45">
            Evalomics separates observed cost from outcome quality, then uses
            benchmark and post-change evidence before any saving can become
            Verified.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/start?intent=analyze"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold no-underline transition hover:bg-slate-800"
              style={{ color: '#ffffff' }}
            >
              Continue to the Work MRI <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/tools"
              className="inline-flex min-h-11 items-center rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/70 no-underline transition hover:bg-white/[0.08] hover:text-white"
            >
              Explore free tools
            </Link>
          </div>
        </div>
      </section>

      <div className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-white/45">
        <ShieldCheck className="mt-1 size-4 shrink-0 text-orange-200/70" />
        <p className="m-0">
          <strong className="text-white/80">Calculation boundary:</strong>{' '}
          implied unsuccessful-request spend assumes cost is distributed evenly
          across requests. It is a diagnostic estimate, not a verified waste
          claim.
        </p>
      </div>
    </div>
  );
}
