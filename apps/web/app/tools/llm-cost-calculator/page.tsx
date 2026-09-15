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
      <section className="max-w-4xl pt-4 sm:pt-8" aria-labelledby="calculator-title">
        <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">
          Free tool · no login
        </p>
        <h1
          id="calculator-title"
          className="mt-4 !text-[clamp(3.2rem,7vw,6.4rem)] !leading-[.9] !tracking-[-.07em] text-slate-950"
        >
          LLM cost,
          <span className="block text-slate-400">without hidden assumptions.</span>
        </h1>
        <p className="mt-7 max-w-2xl text-base leading-7 text-slate-500">
          Enter your real request volume, token averages, and token prices.
          Evalomics performs exact arithmetic in the currency those rates are
          already denominated in. It never silently performs FX conversion.
        </p>
      </section>

      <LlmCostCalculator />

      <section className="grid gap-7 rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,.045)] sm:p-8 lg:grid-cols-[.92fr_1.08fr] lg:items-center">
        <div>
          <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
            Cost is only the first question
          </p>
          <h2 className="mt-3 !text-[clamp(2rem,4vw,3.5rem)] !leading-[.98] !tracking-[-.05em] text-slate-950">
            The Work MRI answers:
            <span className="block text-slate-400">“what should I change?”</span>
          </h2>
        </div>

        <div>
          <p className="m-0 max-w-2xl text-sm leading-6 text-slate-600">
            Cost visibility does not tell you which optimization is safe.
            Evalomics ranks evidence-backed inefficiencies, benchmarks one
            bounded change against a quality floor, and keeps Potential, Tested,
            and Verified states separate.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold no-underline transition hover:bg-slate-800"
              style={{ color: '#ffffff' }}
            >
              Continue to the Work MRI <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/methodology"
              className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 no-underline transition hover:bg-slate-50"
            >
              See methodology
            </Link>
          </div>
        </div>
      </section>

      <div className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
        <ShieldCheck className="mt-1 size-4 shrink-0 text-slate-500" />
        <p className="m-0">
          <strong className="text-slate-900">Calculation boundary:</strong>{' '}
          inference cost only from the values you enter. Tool calls, vector
          databases, infrastructure, taxes, discounts, caching rules, and
          provider-specific billing behavior are excluded unless reflected in
          your entered rates or token averages.
        </p>
      </div>
    </div>
  );
}
