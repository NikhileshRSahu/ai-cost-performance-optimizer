import type { ReactNode } from 'react';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { EvalButton } from '../ui/eval-button';
import { EvalSurface } from '../ui/eval-surface';
import { EvidenceBadge, type EvidenceState } from '../ui/evidence-badge';

export function DirectResult({
  periodLabel,
  observedSpend,
  observedSource,
  modeledUpside,
  testedSavings,
  verifiedSavings,
  confidence,
  strongestAction,
  strongestState,
  recommendationsHref,
  proofHref,
}: Readonly<{
  periodLabel: string;
  observedSpend: string;
  observedSource: string;
  modeledUpside: string;
  testedSavings: string;
  verifiedSavings: string;
  confidence: string;
  strongestAction: ReactNode;
  strongestState: EvidenceState;
  recommendationsHref: string;
  proofHref: string;
}>) {
  return (
    <div className="space-y-6">
      <section>
        <div className="flex flex-wrap items-center gap-2">
          <EvidenceBadge state="OBSERVED" label="Analysis complete" />
          <span className="font-mono text-[11px] text-white/32">{periodLabel}</span>
        </div>
        <h1 className="mt-4 max-w-3xl text-[clamp(2.4rem,5vw,4.8rem)] font-semibold leading-[.94] tracking-[-0.055em] text-white">
          Here&apos;s what your AI usage is costing you.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-white/45">
          Evalomics puts the strongest supported action first. Projections, tests,
          and verified production outcomes stay separate.
        </p>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <EvalSurface tone="raised" className="p-5">
          <EvidenceBadge state="OBSERVED" />
          <p className="mt-5 text-[10px] uppercase tracking-[0.14em] text-white/34">
            Observed spend
          </p>
          <p className="mt-2 font-mono text-2xl text-white">{observedSpend}</p>
          <p className="mt-2 text-[11px] text-white/30">{observedSource}</p>
        </EvalSurface>

        <EvalSurface tone="amber" className="p-5">
          <EvidenceBadge state="POTENTIAL" />
          <p className="mt-5 text-[10px] uppercase tracking-[0.14em] text-white/34">
            Biggest modeled upside
          </p>
          <p className="mt-2 font-mono text-2xl text-[var(--eval-amber)]">
            {modeledUpside}
          </p>
          <p className="mt-2 text-[11px] text-white/30">Planning evidence only</p>
        </EvalSurface>

        <EvalSurface className="p-5">
          <EvidenceBadge state="TESTED" />
          <p className="mt-5 text-[10px] uppercase tracking-[0.14em] text-white/34">
            Tested saving
          </p>
          <p className="mt-2 font-mono text-2xl text-[var(--eval-tested)]">
            {testedSavings}
          </p>
          <p className="mt-2 text-[11px] text-white/30">Quality-gated benchmark</p>
        </EvalSurface>

        <EvalSurface tone="verified" className="p-5">
          <EvidenceBadge state="VERIFIED" />
          <p className="mt-5 text-[10px] uppercase tracking-[0.14em] text-white/34">
            Verified saving
          </p>
          <p className="mt-2 font-mono text-2xl text-[var(--eval-verified)]">
            {verifiedSavings}
          </p>
          <p className="mt-2 text-[11px] text-white/30">Production reconciliation</p>
        </EvalSurface>
      </section>

      <EvalSurface tone="raised" className="overflow-hidden">
        <div className="p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.15em] text-cyan-300/70">
                Recommended next action
              </p>
              <h2 className="mt-2 text-lg font-semibold text-white">
                Strongest supported opportunity
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <EvidenceBadge state={strongestState} />
              <span className="rounded-full border border-white/[0.07] bg-white/[0.02] px-2.5 py-1 text-[10px] text-white/35">
                confidence {confidence}
              </span>
            </div>
          </div>
          <div className="mt-4">{strongestAction}</div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/[0.07] bg-black/15 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div className="flex items-center gap-2 text-xs text-white/35">
            <Sparkles className="size-4 text-cyan-300/60" />
            One action first. Deeper evidence stays optional.
          </div>
          <div className="flex flex-wrap gap-2">
            <EvalButton href={recommendationsHref} variant="secondary">
              All opportunities <ArrowRight className="size-3.5" />
            </EvalButton>
            <EvalButton href={proofHref} variant="ghost">
              <ShieldCheck className="size-3.5" /> Verification
            </EvalButton>
          </div>
        </div>
      </EvalSurface>
    </div>
  );
}
