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
  const hasSaving = recommendation.saving !== null;
  const saving = hasSaving
    ? recommendation.saving.currency + ' ' + recommendation.saving.amount
    : 'Estimate pending';
  const savingLabel =
    recommendation.state === 'VERIFIED'
      ? 'Proven result'
      : recommendation.state === 'TESTED'
        ? 'Evaluated saving'
        : recommendation.savingsConfidence === 'MODELED'
          ? 'Estimated saving'
          : 'Savings estimate';

  const primaryHref =
    recommendation.state === 'TESTED' && recommendation.decision === 'OPTIMIZE'
      ? '/o/' + organizationId + '/implement/' + recommendation.recommendationId
      : recommendation.state === 'VERIFIED'
        ? '/o/' + organizationId + '/proof'
        : '/o/' + organizationId + '/lab/' + recommendation.recommendationId;
  const primaryLabel =
    recommendation.state === 'TESTED' && recommendation.decision === 'OPTIMIZE'
      ? 'Prepare safe rollout'
      : recommendation.state === 'VERIFIED'
        ? 'View proven result'
        : 'Review Evalomics evaluation';

  return (
    <article className="mt-3 overflow-hidden rounded-[24px] border border-white/[0.08] bg-[linear-gradient(145deg,rgba(255,255,255,.035),rgba(255,255,255,.012))]">
      <div className="p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-2.5">
          <EvidenceStatePill state={recommendation.state} />
          <span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-white/35">
            supported recommendation
          </span>
        </div>

        <h2 className="mt-5 max-w-[24ch] text-[clamp(2rem,4vw,3.5rem)] font-semibold leading-[.98] tracking-[-0.05em] text-white">
          {recommendation.title}
        </h2>

        <div className="mt-6 grid gap-3 lg:grid-cols-[1.15fr_.85fr]">
          <div className="rounded-2xl border border-emerald-300/10 bg-emerald-300/[0.035] p-4 sm:p-5">
            <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-100/60">
              What to change
            </p>
            <p className="m-0 mt-2 max-w-4xl text-sm leading-6 text-white/72">
              {recommendation.nextAction}
            </p>
          </div>
          <div className="rounded-2xl border border-sky-300/10 bg-sky-300/[0.035] p-4 sm:p-5">
            <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-100/60">
              Evaluation result
            </p>
            <p className="m-0 mt-2 text-sm font-semibold text-white/80">
              {recommendation.state === 'VERIFIED'
                ? 'Proven in production'
                : recommendation.state === 'TESTED'
                  ? recommendation.decision === 'OPTIMIZE'
                    ? 'Ready to optimize'
                    : recommendation.decision === 'DO_NOT_CHANGE'
                      ? 'Keep current'
                      : 'Evaluated'
                  : 'Candidate identified'}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/[0.07] bg-black/15 p-4">
            <p className="m-0 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/32">
              {savingLabel}
            </p>
            <p className="m-0 mt-2 font-mono text-lg font-semibold text-white/86">
              {saving}
            </p>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-black/15 p-4">
            <p className="m-0 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/32">
              Detection confidence
            </p>
            <p className="m-0 mt-2 text-lg font-semibold text-white/86">
              {recommendation.detectionConfidence}
            </p>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-black/15 p-4">
            <p className="m-0 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/32">
              Savings confidence
            </p>
            <p className="m-0 mt-2 text-lg font-semibold text-white/86">
              {recommendation.savingsConfidence}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.018] px-4 py-4">
          <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/32">
            Why Evalomics chose it
          </p>
          <p className="m-0 mt-2 text-xs leading-5 text-white/52">
            {recommendation.measuredFact ??
              recommendation.inference ??
              'This recommendation was ranked from the strongest supported evidence in the selected usage window.'}
          </p>
          {recommendation.qualityGuard !== null &&
          recommendation.qualityGuard !== undefined ? (
            <p className="m-0 mt-2 text-xs leading-5 text-sky-100/45">
              Quality guard: {recommendation.qualityGuard}
            </p>
          ) : null}
        </div>

        {recommendation.principalLimitation !== null ? (
          <details className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.018] px-4 py-3">
            <summary className="cursor-pointer text-xs font-semibold text-white/48">
              <Gauge className="mr-2 inline size-3.5" />
              Why confidence is not higher
            </summary>
            <p className="m-0 mt-2 text-xs leading-5 text-white/45">
              {recommendation.principalLimitation}
            </p>
          </details>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 border-t border-white/[0.07] bg-black/15 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div>
          <p className="m-0 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/28">
            How to implement
          </p>
          <p className="m-0 mt-1 text-xs text-white/35">
            {recommendation.state === 'VERIFIED'
              ? 'Production evidence confirms this result.'
              : recommendation.state === 'TESTED'
                ? 'Evalomics evaluated this candidate successfully; staged implementation is next.'
                : 'Evalomics found the opportunity. It will evaluate the candidate when comparable evidence is available.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {primaryHref !==
          '/o/' + organizationId + '/lab/' + recommendation.recommendationId ? (
            <Link
              href={
                '/o/' +
                organizationId +
                '/lab/' +
                recommendation.recommendationId
              }
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] px-4 py-2.5 text-sm font-semibold text-white/70 no-underline transition hover:bg-white/[0.07] hover:text-white"
            >
              See details
            </Link>
          ) : null}
          <Link
            href={primaryHref}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 no-underline transition hover:bg-emerald-100"
          >
            {primaryLabel} <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
