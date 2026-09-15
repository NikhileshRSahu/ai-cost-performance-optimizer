import Link from 'next/link';
import { ArrowRight, CircleAlert, Gauge, ShieldCheck } from 'lucide-react';
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
      ? 'Financial amount unavailable'
      : `${recommendation.saving.currency} ${recommendation.saving.amount}`;

  return (
    <article className="overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#0a0f16] shadow-[0_24px_70px_rgba(0,0,0,.18)]">
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.25fr_.75fr]">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <EvidenceStatePill state={recommendation.state} />
            <span className="text-[11px] font-semibold text-white/42">
              {recommendation.stateLabel}
            </span>
            <span className="rounded-full border border-white/[0.09] bg-white/[0.035] px-2.5 py-1 text-[10px] font-semibold text-white/38">
              {recommendation.decision}
            </span>
          </div>
          <h2 className="mt-5 max-w-3xl text-2xl font-semibold leading-tight tracking-[-0.04em] text-white sm:text-3xl">
            {recommendation.title}
          </h2>
          <p
            className={
              'mt-4 font-mono text-2xl font-medium tracking-[-0.04em] ' +
              (recommendation.state === 'VERIFIED'
                ? 'text-emerald-200'
                : recommendation.state === 'TESTED'
                  ? 'text-blue-200'
                  : 'text-amber-200')
            }
          >
            {saving}
          </p>
          {recommendation.saving !== null ? (
            <p className="mt-1 text-[10px] text-white/28">
              {recommendation.saving.horizon === 'THIRTY_DAY_PROJECTION'
                ? '30-day projection'
                : 'observed period'}{' '}
              · state remains {recommendation.state}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2.5">
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/28">
              <Gauge className="size-3.5" /> Confidence
            </div>
            <p className="m-0 mt-2 text-sm font-semibold text-white/72">
              {recommendation.confidenceBand}
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/28">
              <CircleAlert className="size-3.5" /> Principal limitation
            </div>
            <p className="m-0 mt-2 text-xs leading-5 text-white/48">
              {recommendation.principalLimitation ??
                'No additional limitation recorded.'}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/[0.07] bg-white/[0.018] px-5 py-4 sm:px-6">
        <div className="flex items-start gap-2 text-sm leading-6 text-white/58">
          <ShieldCheck className="mt-1 size-4 shrink-0 text-emerald-200/55" />
          <p className="m-0">
            <strong className="text-white/78">Next action:</strong>{' '}
            {recommendation.nextAction}
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {recommendation.state === 'TESTED' &&
          recommendation.decision === 'OPTIMIZE' ? (
            <Link
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-slate-950 no-underline transition hover:bg-emerald-100"
              href={`/o/${organizationId}/implement/${recommendation.recommendationId}`}
            >
              Implement tested change <ArrowRight className="size-3.5" />
            </Link>
          ) : (
            <Link
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-slate-950 no-underline transition hover:bg-slate-100"
              href={`/o/${organizationId}/lab/${recommendation.recommendationId}`}
            >
              Inspect evidence <ArrowRight className="size-3.5" />
            </Link>
          )}
          {recommendation.state === 'TESTED' &&
          recommendation.decision === 'OPTIMIZE' ? (
            <Link
              className="inline-flex min-h-10 items-center rounded-xl border border-white/10 bg-white/[0.035] px-4 py-2 text-xs font-semibold text-white/65 no-underline transition hover:bg-white/[0.07]"
              href={`/o/${organizationId}/lab/${recommendation.recommendationId}`}
            >
              Inspect evidence
            </Link>
          ) : null}
          <Link
            className="inline-flex min-h-10 items-center rounded-xl border border-white/10 bg-white/[0.035] px-4 py-2 text-xs font-semibold text-white/65 no-underline transition hover:bg-white/[0.07]"
            href={`/o/${organizationId}/report/${recommendation.recommendationId}`}
          >
            Open report
          </Link>
        </div>
      </div>
    </article>
  );
}
