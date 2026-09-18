import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { AiAgentCostCalculator } from '../../../components/ai-agent-cost-calculator';

export const metadata: Metadata = {
  title: 'AI Agent Cost Calculator | Evalomics',
  description:
    'Estimate the monthly and per-run cost of an AI agent from model calls, token usage, provider rates, and other tool cost.',
};

export default function Page() {
  return (
    <div className="grid gap-12 pb-8 sm:gap-14">
      <section
        className="max-w-4xl pt-4 sm:pt-8"
        aria-labelledby="calculator-title"
      >
        <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/75">
          Free tool · no login
        </p>
        <h1
          id="calculator-title"
          className="mt-4 !text-[clamp(3.2rem,7vw,6.4rem)] !leading-[.9] !tracking-[-.07em] text-white"
        >
          Agent cost,
          <span className="block text-white/42">from calls to tools.</span>
        </h1>
        <p className="mt-7 max-w-2xl text-base leading-7 text-white/42">
          Estimate model inference plus the per-run tool cost you know today.
          Keep the billing currency separate from the display currency so FX
          conversion is explicit rather than cosmetic.
        </p>
      </section>

      <AiAgentCostCalculator />

      <section className="grid gap-7 rounded-[24px] border border-white/[0.08] bg-[linear-gradient(145deg,rgba(15,23,33,.96),rgba(8,12,17,.98))] p-6 shadow-[0_20px_60px_rgba(15,23,42,.045)] sm:p-8 lg:grid-cols-[.92fr_1.08fr] lg:items-center">
        <div>
          <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--eval-amber)]">
            Agent economics are workload economics
          </p>
          <h2 className="mt-3 !text-[clamp(2rem,4vw,3.5rem)] !leading-[.98] !tracking-[-.05em] text-white">
            Cost per run is useful.
            <span className="block text-white/42">
              Cost per successful run is better.
            </span>
          </h2>
        </div>
        <div>
          <p className="m-0 max-w-2xl text-sm leading-6 text-white/42">
            Retries, storage, orchestration, search, computer use, and external
            APIs can all matter. The Work MRI uses real usage evidence to find
            where those costs are concentrated before recommending a change.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold no-underline transition hover:bg-white/[0.08]"
              style={{ color: '#ffffff' }}
            >
              Continue to the Work MRI <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/tools"
              className="inline-flex min-h-11 items-center rounded-xl border border-white/[0.08] bg-[linear-gradient(145deg,rgba(15,23,33,.96),rgba(8,12,17,.98))] px-5 py-3 text-sm font-semibold text-white/70 no-underline transition hover:bg-white/[0.025]"
            >
              Explore free tools
            </Link>
          </div>
        </div>
      </section>

      <div className="flex gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 text-sm leading-6 text-white/42">
        <ShieldCheck className="mt-1 size-4 shrink-0 text-white/42" />
        <p className="m-0">
          <strong className="text-white/82">Calculation boundary:</strong> this
          is a workload estimate from the assumptions you enter. Unentered
          retries, storage, orchestration, taxes, discounts, and
          provider-specific billing behavior remain outside the estimate.
        </p>
      </div>
    </div>
  );
}
