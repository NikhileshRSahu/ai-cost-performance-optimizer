import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ArrowRight,
  Database,
  Gauge,
  Sparkles,
} from 'lucide-react';
import { formatDecimal, rational } from '../../../../../src/economics/exact';
import { createDatabase } from '../../../../../src/persistence/database';
import { buildFounderDashboardView } from '../../../../../src/workbench/dashboard-view';
import {
  dashboardEstimatedSaving,
  dashboardEvaluationStatus,
} from '../../../../../src/workbench/evalomics-ai';
import { DashboardDrilldown } from '../../../components/workbench/dashboard-drilldown';
import { ResultJourney } from '../../../components/workbench/result-journey';
import { DashboardWidgetGrid } from '../../../components/workbench/dashboard-widget-grid';
import { SignOutButton } from '../../../components/sign-out-button';
import { hasSelfHostedAuthConfiguration } from '../../../lib/auth-config';
import {
  loadFounderDashboardEvidence,
  type DashboardSelection,
} from '../../../lib/dashboard-data';
import { resolveRuntimeSession } from '../../../lib/runtime-session';

export const dynamic = 'force-dynamic';

function dashboardSelection(
  input: Readonly<{
    source?: string;
    importId?: string;
    provider?: string;
  }>,
): DashboardSelection {
  if (
    (input.source === 'demo' || input.source === 'import') &&
    typeof input.importId === 'string' &&
    input.importId.length > 0
  ) {
    return input.source === 'demo'
      ? Object.freeze({ source: 'DEMO', importId: input.importId })
      : Object.freeze({ source: 'IMPORT', importId: input.importId });
  }

  if (input.source === 'provider') {
    const providerName =
      input.provider === 'OPENAI'
        ? 'OpenAI'
        : input.provider === 'ANTHROPIC'
          ? 'Anthropic'
          : null;
    return Object.freeze({ source: 'PROVIDER', providerName });
  }

  return Object.freeze({ source: 'AUTO' });
}

function moneyLabel(
  value: Readonly<{ amount: string; currency: string }> | null,
): string {
  return value === null ? 'Unavailable' : `${value.currency} ${value.amount}`;
}

function verifiedMoney(
  value: Readonly<{
    exactNumerator: string;
    exactDenominator: string;
    currency: string;
  }> | null,
): string {
  if (value === null) return 'Production proof pending';
  return `${value.currency} ${formatDecimal(
    rational(BigInt(value.exactNumerator), BigInt(value.exactDenominator)),
    2,
  )}`;
}

function ConsoleBars({
  values,
  accent = 'bg-sky-400',
}: Readonly<{ values: readonly number[]; accent?: string }>) {
  return (
    <div className="mt-auto flex h-12 items-end gap-1" aria-hidden="true">
      {values.map((value, index) => (
        <span
          key={index}
          className={index === values.length - 1 ? accent : 'bg-white/[0.16]'}
          style={{ height: String(Math.max(14, value)) + '%', width: '100%' }}
        />
      ))}
    </div>
  );
}

function EvidenceHeat({ active }: Readonly<{ active: number }>) {
  return (
    <div
      className="mt-5 grid grid-cols-12 gap-1"
      role="img"
      aria-label={String(active) + ' evidence stages active'}
    >
      {Array.from({ length: 36 }).map((_, index) => {
        const stage = Math.floor(index / 9);
        const reached = stage < active;
        return (
          <span
            key={index}
            className={
              reached
                ? index % 7 === 0
                  ? 'h-3 rounded-[3px] bg-sky-300'
                  : 'h-3 rounded-[3px] bg-sky-500/55'
                : 'h-3 rounded-[3px] bg-white/[0.07]'
            }
          />
        );
      })}
    </div>
  );
}

export default async function CostDashboardPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{
    source?: string;
    importId?: string;
    provider?: string;
    analysis?: string;
    accepted?: string;
    rejected?: string;
    warnings?: string;
  }>;
}>) {
  const { organizationId } = await params;
  const query = await searchParams;
  const session = await resolveRuntimeSession();
  const databaseUrl = process.env.DATABASE_URL;
  if (session === null || databaseUrl === undefined) redirect('/unauthorized');

  const database = createDatabase(databaseUrl);
  let view;
  try {
    view = buildFounderDashboardView(
      await loadFounderDashboardEvidence(
        database.db,
        session,
        organizationId,
        dashboardSelection(query),
      ),
    );
  } finally {
    await database.close();
  }

  const estimatedSaving = dashboardEstimatedSaving(view);
  const estimatedSavingLabel = estimatedSaving ?? 'Estimate pending';
  const evaluationStatus = dashboardEvaluationStatus(view);
  const evaluationStatusLabel =
    evaluationStatus === 'PROVEN'
      ? 'Proven'
      : evaluationStatus === 'READY_TO_OPTIMIZE'
        ? 'Ready to optimize'
        : evaluationStatus === 'KEEP_CURRENT'
          ? 'Keep current'
          : evaluationStatus === 'EVALUATED'
            ? 'Evaluated'
            : evaluationStatus === 'CANDIDATE_IDENTIFIED'
              ? 'Candidate identified'
              : 'Analyzing evidence';

  if (view.dataQuality === 'NO_DATA') {
    return (
      <div className="space-y-7">
        <section>
          <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300">
            AI Efficiency MRI
          </p>
          <h1 className="mt-3 font-mono text-2xl font-medium tracking-[-0.04em] text-slate-100 sm:text-3xl">
            Bring your first usage window into focus.
          </h1>
          <p className="mt-2 max-w-2xl font-mono text-xs leading-5 text-slate-500">
            Connect a supported provider or upload a CSV. Evalomics will analyze
            the evidence and bring you back here with one clear result.
          </p>
          <div className="mt-5 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <p className="m-0 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-white/30">
              What you will get
            </p>
            <p className="m-0 mt-2 text-sm leading-6 text-white/55">
              Observed spend → strongest waste → estimated savings → recommended
              change → exact next action.
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <Link
            href={`/o/${organizationId}/import?mode=connect`}
            className="group min-h-60 rounded-xl border border-white/[0.07] bg-[#111a29] p-6 no-underline transition hover:-translate-y-0.5 hover:border-sky-300/20"
          >
            <Database className="size-5 text-sky-300" />
            <h2 className="mt-8 text-xl font-medium text-slate-100">
              Connect provider
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
              Use OpenAI or Anthropic Admin API evidence.
            </p>
            <span className="mt-7 inline-flex items-center gap-2 text-xs font-semibold text-sky-300">
              Connect source <ArrowRight className="size-3.5" />
            </span>
          </Link>
          <Link
            href={`/o/${organizationId}/import?mode=csv`}
            className="group min-h-60 rounded-xl border border-white/[0.07] bg-[#111a29] p-6 no-underline transition hover:-translate-y-0.5 hover:border-emerald-300/20"
          >
            <Gauge className="size-5 text-emerald-300" />
            <h2 className="mt-8 text-xl font-medium text-slate-100">
              Upload usage CSV
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
              Validate a usage export and run the same analysis path.
            </p>
            <span className="mt-7 inline-flex items-center gap-2 text-xs font-semibold text-emerald-300">
              Upload data <ArrowRight className="size-3.5" />
            </span>
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {view.demoDisclaimer !== null ? (
        <div className="rounded-xl border border-amber-300/15 bg-amber-300/[0.05] px-4 py-3 text-xs font-semibold text-amber-100/70">
          {view.demoDisclaimer}
        </div>
      ) : null}

      <section className="flex flex-col justify-between gap-4 border-b border-white/[0.06] pb-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-3 font-mono text-[11px] text-slate-500">
            {view.periodLabel}
          </p>
          <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300">
            AI Efficiency MRI
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-100 sm:text-3xl">
            We analyzed your AI usage
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Here is the spend we observed, the strongest supported action, and
            what has actually been proven.
          </p>
        </div>
        {hasSelfHostedAuthConfiguration() ? <SignOutButton /> : null}
      </section>

      {view.dataQuality === 'ZERO_USAGE' && view.sourceKind === 'PROVIDER' ? (
        <section className="rounded-xl border border-white/[0.07] bg-[#111a29] p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300/70">
            Connection ready
          </p>
          <h2 className="mt-3 text-xl font-medium text-slate-100">
            No API usage found in this window
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {view.providerName ?? 'Provider'} connected successfully, but no
            usage or cost records were returned for this period.
          </p>
          <Link
            href={`/o/${organizationId}/import`}
            className="mt-5 inline-flex min-h-10 items-center rounded-lg bg-sky-400 px-4 py-2 text-xs font-semibold text-[#08101c] no-underline"
          >
            Check source
          </Link>
        </section>
      ) : (
        <>
          {query.analysis === 'complete' ? (
            <section
              className="rounded-[22px] border border-emerald-300/15 bg-emerald-300/[0.045] p-5 sm:p-6"
              role="status"
            >
              <p className="m-0 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200/70">
                Analysis complete
              </p>
              <h2 className="m-0 mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
                Your data is now part of the Evalomics story.
              </h2>
              <p className="m-0 mt-2 max-w-3xl text-sm leading-6 text-white/50">
                {query.accepted ?? '0'} usage rows analyzed →{' '}
                {moneyLabel(view.observedSpend)} spend reconstructed →{' '}
                {view.recommendations.length} optimization signal
                {view.recommendations.length === 1 ? '' : 's'} found → strongest
                opportunity: {view.strongestAction?.title ?? 'still analyzing'}.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-mono text-white/40">
                <span className="rounded-full border border-white/[0.08] bg-black/15 px-3 py-1.5">
                  accepted · {query.accepted ?? '0'}
                </span>
                <span className="rounded-full border border-white/[0.08] bg-black/15 px-3 py-1.5">
                  rejected · {query.rejected ?? '0'}
                </span>
                <span className="rounded-full border border-white/[0.08] bg-black/15 px-3 py-1.5">
                  warnings · {query.warnings ?? '0'}
                </span>
                <span className="rounded-full border border-white/[0.08] bg-black/15 px-3 py-1.5">
                  next · {evaluationStatusLabel}
                </span>
              </div>
            </section>
          ) : null}

          <ResultJourney
            current={
              evaluationStatus === 'PROVEN'
                ? 'Proven'
                : evaluationStatus === 'READY_TO_OPTIMIZE'
                  ? 'Ready'
                  : evaluationStatus === 'KEEP_CURRENT' ||
                      evaluationStatus === 'EVALUATED'
                    ? 'Evaluated'
                    : evaluationStatus === 'CANDIDATE_IDENTIFIED'
                      ? 'Found'
                      : 'Connected'
            }
          />

          <section className="rounded-[22px] border border-white/[0.08] bg-[#0f1115] p-5">
            <p className="m-0 font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-sky-300/65">
              Outcome summary
            </p>
            <p className="m-0 mt-2 text-sm leading-6 text-white/65">
              You spent {moneyLabel(view.observedSpend)} → Evalomics found{' '}
              {view.recommendations.length} supported opportunity
              {view.recommendations.length === 1 ? '' : 'ies'} → best change:{' '}
              {view.strongestAction?.title ?? 'still analyzing'} → expected
              impact: {estimatedSavingLabel} → confidence:{' '}
              {view.strongestAction?.detectionConfidence ?? 'pending'} → next:{' '}
              {view.strongestAction?.nextAction ?? 'keep evidence connected'}.
            </p>
          </section>

          <DashboardWidgetGrid
            storageKey={`evalomics-dashboard-${organizationId}`}
            items={[
              { id: 'spend', size: 'sm', label: 'How much did I spend?' },
              { id: 'estimated', size: 'sm', label: 'How much can I save?' },
              { id: 'waste', size: 'wide', label: 'What is wasting money?' },
              { id: 'change', size: 'wide', label: 'What should I change?' },
              { id: 'safe', size: 'sm', label: 'Is it safe?' },
              { id: 'next', size: 'wide', label: 'What do I do next?' },
              { id: 'result', size: 'sm', label: 'What happened after rollout?' },
            ]}
          >
            <DashboardDrilldown
              eyebrow="How much did I spend?"
              title={moneyLabel(view.observedSpend)}
              summary="Your measured AI spend for the selected usage window."
              items={[
                { label: 'Spend', value: moneyLabel(view.observedSpend) },
                { label: 'Window', value: view.periodLabel },
                {
                  label: 'Source',
                  value:
                    view.sourceKind === 'PROVIDER'
                      ? (view.providerName ?? 'Provider')
                      : view.sourceKind,
                },
                { label: 'Data quality', value: view.dataQuality },
              ]}
              insight="This is the measured baseline Evalomics uses before estimating any improvement."
              nextStep="Use this baseline to understand whether the recommended change meaningfully reduces cost."
              actionHref={`/o/${organizationId}/import`}
              actionLabel="View usage"
            >
              <article className="flex h-full flex-col rounded-[18px] border border-white/[0.09] bg-[#111214] p-5 font-mono">
                <p className="m-0 text-[10px] uppercase tracking-[0.17em] text-white/42">
                  Spend
                </p>
                <p className="m-0 mt-3 text-[30px] tracking-[-0.05em] text-white">
                  {moneyLabel(view.observedSpend)}
                </p>
                <p className="m-0 mt-1 text-[10px] text-white/30">{view.periodLabel}</p>
                <ConsoleBars
                  values={[34, 48, 42, 61, 53, 67, 58, 72, 64, 78, 70, 88]}
                  accent="bg-sky-400"
                />
              </article>
            </DashboardDrilldown>

            <DashboardDrilldown
              eyebrow="How much can I save?"
              title={estimatedSavingLabel}
              summary="The best savings estimate supported by the evidence currently available."
              items={[
                { label: 'Estimated saving', value: estimatedSavingLabel },
                {
                  label: 'Confidence',
                  value: view.strongestAction?.detectionConfidence ?? 'Pending',
                },
                {
                  label: 'Savings evidence',
                  value: view.strongestAction?.savingsConfidence ?? 'Pending',
                },
                {
                  label: 'Current decision',
                  value: evaluationStatusLabel,
                },
              ]}
              insight={
                estimatedSaving === null
                  ? 'Evalomics has not yet found enough evidence to publish a responsible savings estimate.'
                  : 'This estimate is calculated from workspace evidence and deterministic economics.'
              }
              nextStep={
                view.strongestAction?.nextAction ??
                'Keep the usage evidence connected while Evalomics completes the evaluation.'
              }
              actionHref={`/o/${organizationId}/recommendations`}
              actionLabel="See calculation"
            >
              <article className="flex h-full flex-col rounded-[18px] border border-white/[0.09] bg-[#111214] p-5 font-mono">
                <p className="m-0 text-[10px] uppercase tracking-[0.17em] text-white/42">
                  Estimated savings
                </p>
                <p className="m-0 mt-3 text-[30px] tracking-[-0.05em] text-white">
                  {estimatedSavingLabel}
                </p>
                <p className="m-0 mt-1 text-[10px] text-white/30">
                  {view.strongestAction?.detectionConfidence ?? 'Pending'} confidence
                </p>
                <ConsoleBars
                  values={[24, 31, 27, 39, 36, 48, 44, 52, 57, 61, 68, 74]}
                  accent="bg-emerald-400"
                />
              </article>
            </DashboardDrilldown>

            <DashboardDrilldown
              eyebrow="What is wasting money?"
              title={
                view.strongestAction?.measuredFact ??
                view.strongestAction?.title ??
                'No clear waste pattern yet'
              }
              summary="The strongest supported inefficiency Evalomics found in this usage window."
              items={[
                {
                  label: 'Strongest signal',
                  value:
                    view.strongestAction?.measuredFact ??
                    view.strongestAction?.title ??
                    'Still analyzing',
                },
                {
                  label: 'Why it matters',
                  value:
                    view.strongestAction?.inference ??
                    'No supported inference yet',
                },
                {
                  label: 'Confidence',
                  value: view.strongestAction?.detectionConfidence ?? 'Pending',
                },
                {
                  label: 'Opportunities',
                  value: String(view.recommendations.length),
                },
              ]}
              insight={
                view.strongestAction?.inference ??
                'Evalomics has not found a strong enough inefficiency signal yet.'
              }
              nextStep="Use the recommended change card to see what Evalomics would do about this waste."
              actionHref={`/o/${organizationId}/recommendations`}
              actionLabel="See opportunities"
            >
              <article className="flex h-full flex-col rounded-[18px] border border-white/[0.09] bg-[#111214] p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="m-0 font-mono text-[10px] uppercase tracking-[0.17em] text-white/42">
                    Biggest waste
                  </p>
                  <span className="rounded-full bg-rose-400/10 px-2 py-1 font-mono text-[9px] text-rose-200/70">
                    {String(view.recommendations.length)} found
                  </span>
                </div>
                <p className="m-0 mt-5 max-w-2xl text-xl font-semibold leading-7 tracking-[-0.03em] text-white">
                  {view.strongestAction?.measuredFact ??
                    view.strongestAction?.title ??
                    'No clear waste pattern yet'}
                </p>
                <p className="m-0 mt-3 max-w-2xl text-sm leading-6 text-white/38">
                  {view.strongestAction?.inference ??
                    'Evalomics needs more usage evidence before identifying the main cost leak.'}
                </p>
              </article>
            </DashboardDrilldown>

            <DashboardDrilldown
              eyebrow="What should I change?"
              title={view.strongestAction?.title ?? 'No change recommended yet'}
              summary="The single highest-priority change Evalomics recommends from the current evidence."
              items={[
                {
                  label: 'Change',
                  value: view.strongestAction?.title ?? 'None yet',
                },
                {
                  label: 'Expected impact',
                  value: estimatedSavingLabel,
                },
                {
                  label: 'Confidence',
                  value: view.strongestAction?.detectionConfidence ?? 'Pending',
                },
                {
                  label: 'Decision',
                  value: evaluationStatusLabel,
                },
              ]}
              insight={
                view.strongestAction?.inference ??
                'No supported production change has been identified yet.'
              }
              nextStep={
                view.strongestAction?.nextAction ??
                'Keep collecting usage evidence until Evalomics can support a change.'
              }
              actionHref={`/o/${organizationId}/recommendations`}
              actionLabel="Open recommendation"
            >
              <article className="flex h-full flex-col rounded-[18px] border border-white/[0.09] bg-[#111214] p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="m-0 font-mono text-[10px] uppercase tracking-[0.17em] text-white/42">
                    Best change
                  </p>
                  <Sparkles className="size-4 text-emerald-300/65" />
                </div>
                <p className="m-0 mt-5 max-w-2xl text-2xl font-semibold leading-8 tracking-[-0.04em] text-white">
                  {view.strongestAction?.title ?? 'No change recommended yet'}
                </p>
                <div className="mt-auto flex flex-wrap gap-5 pt-5 font-mono text-[10px] text-white/38">
                  <span>impact · {estimatedSavingLabel}</span>
                  <span>
                    confidence · {view.strongestAction?.detectionConfidence ?? 'pending'}
                  </span>
                </div>
              </article>
            </DashboardDrilldown>

            <DashboardDrilldown
              eyebrow="Is it safe?"
              title={
                evaluationStatus === 'READY_TO_OPTIMIZE'
                  ? 'Yes — ready to stage'
                  : evaluationStatus === 'KEEP_CURRENT'
                    ? 'No — keep current'
                    : evaluationStatus === 'PROVEN'
                      ? 'Yes — proven'
                      : evaluationStatus === 'EVALUATED'
                        ? 'Evaluated'
                        : 'Still evaluating'
              }
              summary="Whether the candidate has enough quality/performance evidence to justify a production change."
              items={[
                { label: 'Status', value: evaluationStatusLabel },
                {
                  label: 'Quality guard',
                  value: view.strongestAction?.qualityGuard ?? 'Not available',
                },
                {
                  label: 'Decision',
                  value: view.strongestAction?.decision ?? 'Pending',
                },
                {
                  label: 'Confidence',
                  value: view.strongestAction?.detectionConfidence ?? 'Pending',
                },
              ]}
              insight={
                evaluationStatus === 'READY_TO_OPTIMIZE'
                  ? 'The candidate passed the available evaluation requirements.'
                  : evaluationStatus === 'KEEP_CURRENT'
                    ? 'The candidate did not justify changing production behavior.'
                    : 'Evalomics does not yet have enough evaluation evidence to give a clear rollout decision.'
              }
              nextStep={
                view.strongestAction?.nextAction ??
                'Wait for enough comparable evidence before changing production.'
              }
              actionHref={`/o/${organizationId}/recommendations`}
              actionLabel="View evaluation"
            >
              <article className="flex h-full flex-col rounded-[18px] border border-white/[0.09] bg-[#111214] p-5">
                <p className="m-0 font-mono text-[10px] uppercase tracking-[0.17em] text-white/42">
                  Is this safe?
                </p>
                <p className="m-0 mt-4 text-xl font-semibold tracking-[-0.03em] text-white">
                  {evaluationStatus === 'READY_TO_OPTIMIZE'
                    ? 'Ready to stage'
                    : evaluationStatus === 'KEEP_CURRENT'
                      ? 'Keep current'
                      : evaluationStatus === 'PROVEN'
                        ? 'Proven'
                        : evaluationStatus === 'EVALUATED'
                          ? 'Evaluated'
                          : 'Still evaluating'}
                </p>
                <p className="m-0 mt-2 font-mono text-[10px] text-white/30">
                  {view.strongestAction?.qualityGuard ?? 'quality evidence pending'}
                </p>
                <div className="mt-auto flex items-center gap-2 pt-5">
                  <span
                    className={
                      evaluationStatus === 'READY_TO_OPTIMIZE' ||
                      evaluationStatus === 'PROVEN'
                        ? 'size-2 rounded-full bg-emerald-400'
                        : evaluationStatus === 'KEEP_CURRENT'
                          ? 'size-2 rounded-full bg-rose-400'
                          : 'size-2 rounded-full bg-amber-300'
                    }
                  />
                  <span className="font-mono text-[10px] text-white/36">
                    {evaluationStatusLabel}
                  </span>
                </div>
              </article>
            </DashboardDrilldown>

            <DashboardDrilldown
              eyebrow="What do I do next?"
              title={view.strongestAction?.nextAction ?? 'Keep evidence connected'}
              summary="The next action Evalomics wants you to take — no methodology required."
              items={[
                {
                  label: 'Next action',
                  value: view.strongestAction?.nextAction ?? 'Keep evidence connected',
                },
                {
                  label: 'Recommended change',
                  value: view.strongestAction?.title ?? 'Pending',
                },
                { label: 'Status', value: evaluationStatusLabel },
                { label: 'Expected impact', value: estimatedSavingLabel },
              ]}
              insight="This card turns the analysis into the next concrete action."
              nextStep={
                view.strongestAction?.nextAction ??
                'Keep evidence connected until Evalomics can support a specific change.'
              }
              actionHref={
                view.strongestAction?.state === 'TESTED' &&
                view.strongestAction.decision === 'OPTIMIZE'
                  ? `/o/${organizationId}/implement/${view.strongestAction.recommendationId}`
                  : `/o/${organizationId}/recommendations`
              }
              actionLabel={
                view.strongestAction?.state === 'TESTED' &&
                view.strongestAction.decision === 'OPTIMIZE'
                  ? 'Start implementation'
                  : 'Open next action'
              }
            >
              <article className="flex h-full flex-col rounded-[18px] border border-white/[0.09] bg-[#111214] p-5">
                <p className="m-0 font-mono text-[10px] uppercase tracking-[0.17em] text-white/42">
                  Next step
                </p>
                <p className="m-0 mt-5 max-w-3xl text-xl font-semibold leading-7 tracking-[-0.03em] text-white">
                  {view.strongestAction?.nextAction ?? 'Keep evidence connected'}
                </p>
                <p className="m-0 mt-3 text-sm text-emerald-200/55">
                  {evaluationStatusLabel}
                </p>
              </article>
            </DashboardDrilldown>

            <DashboardDrilldown
              eyebrow="What happened after rollout?"
              title={
                view.verifiedNetSavings === null
                  ? 'No production result yet'
                  : verifiedMoney(view.verifiedNetSavings)
              }
              summary="The measured production result after an optimization is actually deployed."
              items={[
                {
                  label: 'Production result',
                  value:
                    view.verifiedNetSavings === null
                      ? 'Not rolled out yet'
                      : verifiedMoney(view.verifiedNetSavings),
                },
                { label: 'Expected impact', value: estimatedSavingLabel },
                { label: 'Status', value: evaluationStatusLabel },
                {
                  label: 'Recommendation',
                  value: view.strongestAction?.title ?? 'Pending',
                },
              ]}
              insight={
                view.verifiedNetSavings === null
                  ? 'There is no post-change production result because this change has not completed rollout and measurement yet.'
                  : 'Production evidence confirms the measured result shown here.'
              }
              nextStep={
                view.verifiedNetSavings === null
                  ? 'Complete a rollout before expecting a production result.'
                  : 'Review the production evidence behind this result.'
              }
              actionHref={`/o/${organizationId}/proof`}
              actionLabel="View production result"
            >
              <article className="flex h-full flex-col rounded-[18px] border border-white/[0.09] bg-[#111214] p-5 font-mono">
                <p className="m-0 text-[10px] uppercase tracking-[0.17em] text-white/42">
                  Production result
                </p>
                <p className="m-0 mt-4 text-xl font-semibold tracking-[-0.03em] text-white">
                  {view.verifiedNetSavings === null
                    ? 'After rollout'
                    : verifiedMoney(view.verifiedNetSavings)}
                </p>
                <p className="m-0 mt-2 text-[10px] text-white/30">
                  {view.verifiedNetSavings === null
                    ? 'No production change measured yet'
                    : 'measured production impact'}
                </p>
              </article>
            </DashboardDrilldown>
          </DashboardWidgetGrid>
        </>
      )}
    </div>
  );
}
