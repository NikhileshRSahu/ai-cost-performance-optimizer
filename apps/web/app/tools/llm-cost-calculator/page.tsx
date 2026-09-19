import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { LlmCostCalculator } from '../../../components/llm-cost-calculator';

export const metadata: Metadata = {
  title: 'Free LLM Cost Calculator | Evalomics',
  description:
    'Estimate monthly LLM cost from request volume, token usage, and your own input/output token prices. No provider credentials required.',
};

export default function LlmCostCalculatorPage() {
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
          LLM cost,
          <span className="block text-white/45">
            without hidden assumptions.
          </span>
        </h1>
        <p className="mt-7 max-w-2xl text-base leading-7 text-white/45">
          Enter your real request volume, token averages, and token prices, or
          start from a dated first-party provider preset. Keep the billing
          currency separate from the display currency: when they differ,
          Evalomics shows the timestamped reference FX rate used for conversion.
        </p>
      </section>

      <LlmCostCalculator />

      <section className="eval-glass-card grid gap-7 rounded-[24px] p-6 sm:p-8 lg:grid-cols-[.92fr_1.08fr] lg:items-center">
        <div>
          <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-orange-200/75">
            Cost is only the first question
          </p>
          <h2 className="mt-3 !text-[clamp(2rem,4vw,3.5rem)] !leading-[.98] !tracking-[-.05em] text-white">
            The Work MRI answers:
            <span className="block text-white/45">“what should I change?”</span>
          </h2>
        </div>

        <div>
          <p className="m-0 max-w-2xl text-sm leading-6 text-white/45">
            Cost visibility does not tell you which optimization is safe.
            Evalomics ranks evidence-backed inefficiencies, benchmarks one
            bounded change against a quality floor, and keeps Potential, Tested,
            and Verified states separate.
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
              href="/methodology"
              className="inline-flex min-h-11 items-center rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/70 no-underline transition hover:bg-white/[0.08] hover:text-white"
            >
              See methodology
            </Link>
          </div>
        </div>
      </section>

      <div className="eval-glass-card flex gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 text-sm leading-6 text-white/55">
        <ShieldCheck className="mt-1 size-4 shrink-0 text-orange-200/80" />
        <p className="m-0">
          <strong className="text-white/90">Calculation boundary:</strong>{' '}
          inference cost only from the values you enter. Tool calls, vector
          databases, infrastructure, taxes, discounts, caching rules, and
          provider-specific billing behavior are excluded unless reflected in
          your entered rates or token averages.
        </p>
      </div>
    </div>
  );
}
