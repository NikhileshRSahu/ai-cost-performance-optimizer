import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { PromptCacheSavingsCalculator } from '../../../components/prompt-cache-savings-calculator';

export const metadata: Metadata = {
  title: 'Prompt Cache Savings Calculator | Evalomics',
  description:
    'Estimate potential input-token savings from your cache hit rate and the cached versus uncached rates you actually pay.',
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
          Prompt caching,
          <span className="block text-white/42">
            with the premium exposed.
          </span>
        </h1>
        <p className="mt-7 max-w-2xl text-base leading-7 text-white/42">
          Compare the uncached and cached rates you actually pay. If caching
          increases cost under your assumptions, Evalomics shows the premium
          instead of presenting a negative number as a “saving.”
        </p>
      </section>

      <PromptCacheSavingsCalculator />

      <section className="grid gap-7 rounded-[24px] border border-white/[0.08] bg-[linear-gradient(145deg,rgba(15,23,33,.96),rgba(8,12,17,.98))] p-6 shadow-[0_20px_60px_rgba(15,23,42,.045)] sm:p-8 lg:grid-cols-[.92fr_1.08fr] lg:items-center">
        <div>
          <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--eval-amber)]">
            Potential is not verified
          </p>
          <h2 className="mt-3 !text-[clamp(2rem,4vw,3.5rem)] !leading-[.98] !tracking-[-.05em] text-white">
            Estimate the opportunity.
            <span className="block text-white/42">
              Then benchmark the change.
            </span>
          </h2>
        </div>
        <div>
          <p className="m-0 max-w-2xl text-sm leading-6 text-white/42">
            Provider caching rules, write fees, storage duration, and
            eligibility can materially change realized savings. The Work MRI
            keeps this calculator estimate separate from Tested and Verified
            evidence.
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
              className="inline-flex min-h-11 items-center rounded-xl border border-white/[0.08] bg-[linear-gradient(145deg,rgba(15,23,33,.96),rgba(8,12,17,.98))] px-5 py-3 text-sm font-semibold text-white/70 no-underline transition hover:bg-[linear-gradient(145deg,rgba(15,23,33,.96),rgba(8,12,17,.98))]/[0.025]"
            >
              Explore free tools
            </Link>
          </div>
        </div>
      </section>

      <div className="flex gap-3 rounded-2xl border border-white/[0.08] bg-[linear-gradient(145deg,rgba(15,23,33,.96),rgba(8,12,17,.98))]/[0.025] p-4 text-sm leading-6 text-white/42">
        <ShieldCheck className="mt-1 size-4 shrink-0 text-white/42" />
        <p className="m-0">
          <strong className="text-white/82">Calculation boundary:</strong> this
          isolates the cacheable input-token portion you enter. Output tokens,
          cache-write fees, storage duration, provider eligibility, taxes, and
          other infrastructure are excluded unless you explicitly reflect them
          in the entered rates.
        </p>
      </div>
    </div>
  );
}
