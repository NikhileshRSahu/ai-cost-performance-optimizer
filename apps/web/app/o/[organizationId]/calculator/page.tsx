import Link from 'next/link';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { WorkspaceModelCalculator } from '../../../../components/workbench/workspace-model-calculator';

export default function ModelCalculatorPage() {
  return (
    <div className="space-y-7">
      <section>
        <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">
          What-if planning
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-100 sm:text-3xl">
          Model Calculator
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          Compare the inference economics of your current and candidate model
          before you run a quality benchmark.
        </p>
      </section>

      <WorkspaceModelCalculator />

      <section className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="m-0 text-xs font-medium text-slate-300">
              Need a more specific planning tool?
            </p>
            <p className="m-0 mt-1 text-[11px] text-slate-500">
              Cache savings and cost-per-outcome calculators remain available.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/tools/prompt-cache-savings"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3.5 py-2 text-xs font-semibold text-slate-300 no-underline transition hover:text-white"
            >
              Cache calculator <ExternalLink className="size-3.5" />
            </Link>
            <Link
              href="/tools/cost-per-outcome"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3.5 py-2 text-xs font-semibold text-slate-300 no-underline transition hover:text-white"
            >
              Cost per outcome <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
