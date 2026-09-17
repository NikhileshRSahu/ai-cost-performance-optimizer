import Link from 'next/link';
import { ArrowRight, Gauge } from 'lucide-react';
import type { DashboardRecommendationView } from '../../../src/workbench/dashboard-view';
import { EvidenceStatePill } from './evidence-state-pill';

export function RecommendationCard({
  organizationId,
  recommendation,
}: Readonly<{
  organizationId: string;
  recommendation: DashboardRecommendationView;
}>) {
  const saving =
    recommendation.saving === null
      ? 'Saving amount unavailable'
      : `${recommendation.saving.currency} ${recommendation.saving.amount}`;

  const primaryHref =
    recommendation.state === 'TESTED' && recommendation.decision === 'OPTIMIZE'
      ? `/o/${organizationId}/implement/${recommendation.recommendationId}`
      : recommendation.state === 'VERIFIED'
        ? `/o/${organizationId}/proof`
        : `/o/${organizationId}/lab/${recommendation.recommendationId}`;

  const primaryLabel =
    recommendation.state === 'TESTED' && recommendation.decision === 'OPTIMIZE'
      ? 'Prepare safe rollout'
      : recommendation.state === 'VERIFIED'
        ? 'View verified savings'
        : 'Test this optimization';

  return (
    <article className="mt-2 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.018]">
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.35fr_.65fr]">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <EvidenceStatePill state={recommendation.state} />
            <span className="text-[11px] font-semibold text-white/65">
              {recommendation.state === 'TESTED'
                ? 'Tested result'
                : recommendation.state === 'VERIFIED'
                  ? 'Verified result'
                  : 'Opportunity'}
            </span>
          </div>

          <h2 className="mt-4 max-w-3xl text-2xl font-semibold leading-tight tracking-[-0.04em] text-white sm:text-3xl">
            {recommendation.title}
          </h2>

          <div className="mt-5 flex flex-wrap items-end gap-x-5 gap-y-2">
            <div>
              <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/42">
                {recommendation.state === 'TESTED'
                  ? 'Tested saving'
                  : recommendation.state === 'VERIFIED'
                    ? 'Verified saving'
                    : 'Potential saving'}
              </p>
              <p className="m-0 mt-1 font-mono text-3xl font-medium tracking-[-0.04em] text-white">
                {saving}
              </p>
            </div>
            <p className="m-0 pb-1 text-xs text-white/48">
              {recommendation.state === 'TESTED'
                ? 'Benchmark-supported, not yet verified in production'
                : recommendation.state === 'VERIFIED'
                  ? 'Supported by comparable post-change evidence'
                  : 'Opportunity only, not achieved'}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
            <Gauge className="size-3.5" /> Confidence
          </div>
          <p className="m-0 mt-2 text-lg font-semibold text-white/82">
            {recommendation.confidenceBand} confidence
          </p>
          {recommendation.principalLimitation !== null ? (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs font-medium text-white/55">
                Why this is not fully verified yet
              </summary>
              <p className="mt-2 text-xs leading-5 text-white/55">
                {recommendation.principalLimitation}
              </p>
            </details>
          ) : null}
        </div>
      </div>

      <div className="border-t border-white/[0.07] bg-white/[0.014] px-5 py-4 sm:px-6">
        <Link
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 no-underline transition hover:bg-emerald-100"
          href={primaryHref}
        >
          {primaryLabel} <ArrowRight className="size-4" />
        </Link>
      </div>
    </article>
  );
}
