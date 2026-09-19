import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ArrowRight,
  BadgeDollarSign,
  Database,
  Gauge,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { formatDecimal, rational } from '../../../../../src/economics/exact';
import { createDatabase } from '../../../../../src/persistence/database';
import { buildFounderDashboardView } from '../../../../../src/workbench/dashboard-view';
import {
  dashboardEstimatedSaving,
  dashboardEvaluationStatus,
} from '../../../../../src/workbench/evalomics-ai';
import { RecommendationCard } from '../../../components/recommendation-card';
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
                {query.accepted ?? '0'} usage rows were accepted. Evalomics
                reconstructed the evidence, ranked supported opportunities, and
                prepared the next decision below.
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

          <DashboardWidgetGrid
            storageKey={`evalomics-dashboard-${organizationId}`}
            items={[
              {
                id: 'recommendation',
                size: 'wide',
                label: 'Recommended action',
              },
              { id: 'evidence', size: 'wide', label: 'Evidence status' },
              { id: 'spend', size: 'sm', label: 'Observed AI spend' },
              {
                id: 'opportunities',
                size: 'sm',
                label: 'Opportunities found',
              },
              { id: 'estimated', size: 'sm', label: 'Estimated savings' },
              { id: 'evaluation', size: 'sm', label: 'Evaluation status' },
              { id: 'diagnosis', size: 'lg', label: 'Usage diagnosis' },
            ]}
          >
            <DashboardDrilldown
              eyebrow="Recommended action"
              title={
                view.strongestAction?.title ?? 'No supported optimization yet'
              }
              summary={
                view.strongestAction === null
                  ? 'Evalomics has not found enough evidence to recommend a production change yet.'
                  : 'This is the highest-priority supported action from the evidence currently available in your workspace.'
              }
              items={[
                {
                  label: 'Evidence state',
                  value: view.strongestAction?.state ?? 'Observed only',
                  note: 'Found, Evaluated, and Proven remain separate decision states.',
                },
                {
                  label: 'Detected saving',
                  value:
                    view.strongestAction?.saving === null ||
                    view.strongestAction === null
                      ? 'Not measured'
                      : view.strongestAction.saving.currency +
                        ' ' +
                        view.strongestAction.saving.amount,
                  note: 'A detected opportunity is not automatically verified savings.',
                },
                {
                  label: 'Detection confidence',
                  value:
                    view.strongestAction?.detectionConfidence ??
                    'Insufficient evidence',
                },
                {
                  label: 'Savings confidence',
                  value:
                    view.strongestAction?.savingsConfidence ?? 'Unmeasured',
                },
              ]}
              insight={
                view.strongestAction?.principalLimitation ??
                'Evalomics ranks only findings supported by the evidence currently available.'
              }
              nextStep={
                view.strongestAction?.nextAction ??
                'Connect more usage evidence before making a production change.'
              }
              actionHref={`/o/${organizationId}/recommendations`}
              actionLabel="View all recommendations"
            >
              <section className="flex h-full flex-col rounded-[22px] border border-white/[0.10] bg-[#121316] p-5 font-mono sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
                      Recommended action
                    </p>
                    <h2 className="mt-2 font-mono text-base font-medium text-white">
                      {view.strongestAction?.state === 'TESTED'
                        ? 'Best evaluated improvement'
                        : view.strongestAction?.state === 'VERIFIED'
                          ? 'Best proven improvement'
                          : 'Strongest supported action'}
                    </h2>
                  </div>
                  <Sparkles className="size-4 text-emerald-300/60" />
                </div>

                {view.strongestAction === null ? (
                  <div className="mt-5 rounded-lg border border-dashed border-white/[0.08] p-5">
                    <p className="text-sm font-medium text-slate-300">
                      No supported optimization yet
                    </p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Add more evidence before changing production behavior.
                    </p>
                  </div>
                ) : (
                  <RecommendationCard
                    organizationId={organizationId}
                    recommendation={view.strongestAction}
                  />
                )}

                <Link
                  href={`/o/${organizationId}/recommendations`}
                  className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-sky-300 no-underline"
                >
                  View all recommendations <ArrowRight className="size-3.5" />
                </Link>
              </section>
            </DashboardDrilldown>

            <DashboardDrilldown
              eyebrow="Evidence status"
              title="How far Evalomics has taken this result"
              summary="Evalomics shows the complete path from observed usage to a found opportunity, candidate evaluation, and finally a proven production result."
              items={[
                { label: 'Observed', value: 'Usage + cost evidence loaded' },
                {
                  label: 'Potential',
                  value:
                    view.strongestAction !== null
                      ? 'Opportunity identified'
                      : 'Still analyzing',
                },
                {
                  label: 'Evaluated',
                  value:
                    view.strongestAction?.state === 'TESTED' ||
                    view.strongestAction?.state === 'VERIFIED'
                      ? 'Candidate evaluated'
                      : 'Evaluation pending',
                },
                {
                  label: 'Proven',
                  value:
                    view.verifiedNetSavings !== null
                      ? verifiedMoney(view.verifiedNetSavings)
                      : 'After rollout',
                },
              ]}
              insight="This journey lets Evalomics give a useful recommendation early while keeping final production proof honest."
              nextStep={
                view.verifiedNetSavings === null
                  ? 'Open proof status to see exactly what evidence is still missing.'
                  : 'Review the production evidence behind the verified saving.'
              }
              actionHref={`/o/${organizationId}/proof`}
              actionLabel={
                view.verifiedNetSavings === null
                  ? 'View result evidence'
                  : 'Open proven result'
              }
            >
              <section className="flex h-full flex-col rounded-[22px] border border-white/[0.10] bg-[#121316] p-5 font-mono sm:p-6">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-violet-300" />
                  <h2 className="text-sm font-medium text-slate-100">
                    Evidence status
                  </h2>
                </div>
                <EvidenceHeat
                  active={
                    view.verifiedNetSavings !== null
                      ? 4
                      : view.strongestAction?.state === 'TESTED'
                        ? 3
                        : view.strongestAction !== null
                          ? 2
                          : 1
                  }
                />
                <div className="mt-5 grid gap-3">
                  {[
                    ['Observed', 'Usage and cost evidence loaded', true],
                    [
                      'Potential',
                      'Best opportunity identified',
                      view.strongestAction !== null,
                    ],
                    [
                      'Evaluated',
                      'Candidate checked by Evalomics',
                      view.strongestAction?.state === 'TESTED' ||
                        view.strongestAction?.state === 'VERIFIED',
                    ],
                    [
                      'Proven',
                      'Production proof',
                      view.verifiedNetSavings !== null,
                    ],
                  ].map(([label, detail, reached]) => (
                    <div
                      key={String(label)}
                      className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-3"
                    >
                      <div>
                        <p className="text-xs font-medium text-slate-300">
                          {String(label)}
                        </p>
                        <p className="mt-1 font-mono text-[10px] text-slate-500">
                          {String(detail)}
                        </p>
                      </div>
                      <span
                        className={
                          reached
                            ? 'size-2 rounded-full bg-emerald-400'
                            : 'size-2 rounded-full bg-slate-700'
                        }
                      />
                    </div>
                  ))}
                </div>
                <Link
                  href={`/o/${organizationId}/proof`}
                  className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-violet-300 no-underline"
                >
                  {view.verifiedNetSavings === null
                    ? 'View result evidence'
                    : 'Open proven result'}{' '}
                  <ArrowRight className="size-3.5" />
                </Link>
              </section>
            </DashboardDrilldown>

            <DashboardDrilldown
              eyebrow="Observed AI spend"
              title={moneyLabel(view.observedSpend)}
              summary="This is the spend Evalomics can directly support from the selected usage evidence. It is the baseline used before estimating or verifying any optimization impact."
              items={[
                {
                  label: 'Observed spend',
                  value: moneyLabel(view.observedSpend),
                },
                {
                  label: 'Evidence source',
                  value:
                    view.sourceKind === 'PROVIDER'
                      ? (view.providerName ?? 'Provider')
                      : view.sourceKind,
                },
                { label: 'Analysis window', value: view.periodLabel },
                {
                  label: 'Evidence quality',
                  value: view.dataQuality,
                  note: 'Only observed evidence is treated as baseline truth.',
                },
              ]}
              insight="Evalomics starts from measured usage and cost rather than inventing a savings target."
              nextStep="Open Usage & Import if you want to add another source or refresh the evidence window."
              actionHref={`/o/${organizationId}/import`}
              actionLabel="Open usage & import"
            >
              <article className="flex h-full flex-col rounded-[22px] border border-white/[0.10] bg-[#121316] p-5 font-mono">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
                  Observed AI spend
                </p>
                <p className="mt-4 font-mono text-3xl tracking-[-0.04em] text-white">
                  {moneyLabel(view.observedSpend)}
                </p>
                <p className="mt-2 font-mono text-[10px] text-slate-500">
                  {view.sourceKind === 'PROVIDER'
                    ? (view.providerName ?? 'Provider')
                    : view.sourceKind}
                </p>
                <ConsoleBars
                  values={[34, 48, 42, 61, 53, 67, 58, 72, 64, 78, 70, 88]}
                  accent="bg-sky-400"
                />
              </article>
            </DashboardDrilldown>

            <DashboardDrilldown
              eyebrow="Opportunities found"
              title={
                String(view.recommendations.length) +
                ' supported recommendation' +
                (view.recommendations.length === 1 ? '' : 's')
              }
              summary="These are the optimization opportunities Evalomics can support from the current evidence. They are ranked findings, not automatic production changes."
              items={[
                {
                  label: 'Supported opportunities',
                  value: String(view.recommendations.length),
                },
                {
                  label: 'Strongest action',
                  value: view.strongestAction?.title ?? 'None yet',
                },
                {
                  label: 'Detection confidence',
                  value:
                    view.strongestAction?.detectionConfidence ??
                    'Insufficient evidence',
                },
                {
                  label: 'Current evidence state',
                  value: view.strongestAction?.state ?? 'Observed only',
                },
              ]}
              insight={
                view.strongestAction?.nextAction ??
                'No optimization has enough support to recommend yet.'
              }
              nextStep="Open the recommendation list to compare opportunities, evidence, expected impact, and the exact implementation path."
              actionHref={`/o/${organizationId}/recommendations`}
              actionLabel="Review opportunities"
            >
              <article className="rounded-xl border border-white/[0.07] bg-[#111a29] p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
                  Opportunities found
                </p>
                <p className="mt-4 font-mono text-3xl tracking-[-0.04em] text-white">
                  {String(view.recommendations.length)}
                </p>
                <p className="mt-2 font-mono text-[10px] text-slate-500">
                  supported recommendations
                </p>
                <ConsoleBars
                  values={[18, 24, 20, 33, 29, 38, 31, 46, 42, 54, 51, 63]}
                  accent="bg-emerald-400"
                />
              </article>
            </DashboardDrilldown>

            <DashboardDrilldown
              eyebrow="Estimated savings"
              title={estimatedSavingLabel}
              summary="This is the best savings estimate Evalomics can currently support from the selected evidence. It is useful for prioritization now; production proof is a later confirmation step."
              items={[
                { label: 'Estimated saving', value: estimatedSavingLabel },
                {
                  label: 'Savings confidence',
                  value:
                    view.strongestAction?.savingsConfidence ??
                    'Pending evaluation',
                },
                {
                  label: 'Strongest opportunity',
                  value: view.strongestAction?.title ?? 'Still analyzing',
                },
                {
                  label: 'Evaluation status',
                  value: evaluationStatusLabel,
                },
              ]}
              insight={
                estimatedSaving === null
                  ? 'Evalomics has found an optimization candidate, but it is still building enough comparable evidence to publish a responsible savings estimate.'
                  : 'This estimate comes from Evalomics evidence and economics, not generated guesswork.'
              }
              nextStep={
                view.strongestAction?.nextAction ??
                'Keep the usage evidence connected so Evalomics can finish candidate evaluation.'
              }
              actionHref={`/o/${organizationId}/recommendations`}
              actionLabel="See how this was calculated"
            >
              <article className="flex h-full flex-col rounded-[22px] border border-white/[0.10] bg-[#121316] p-5 font-mono">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
                  Estimated savings
                </p>
                <p className="mt-4 font-mono text-3xl tracking-[-0.04em] text-white">
                  {estimatedSavingLabel}
                </p>
                <p className="mt-2 font-mono text-[10px] text-slate-500">
                  {estimatedSaving === null
                    ? 'Evalomics evaluation in progress'
                    : 'evidence-backed estimate'}
                </p>
                <ConsoleBars
                  values={[24, 31, 27, 39, 36, 48, 44, 52, 57, 61, 68, 74]}
                  accent="bg-amber-300"
                />
              </article>
            </DashboardDrilldown>

            <DashboardDrilldown
              eyebrow="Evaluation status"
              title={evaluationStatusLabel}
              summary="This is the customer-facing decision state. Evalomics identifies the candidate, evaluates it when comparable evidence is available, and only later marks the production result as proven."
              items={[
                {
                  label: 'Current status',
                  value: evaluationStatusLabel,
                },
                {
                  label: 'Recommendation',
                  value:
                    view.strongestAction?.title ?? 'No supported candidate yet',
                },
                {
                  label: 'Detection confidence',
                  value: view.strongestAction?.detectionConfidence ?? 'Pending',
                },
                {
                  label: 'Production proof',
                  value:
                    view.verifiedNetSavings === null
                      ? 'Later confirmation step'
                      : verifiedMoney(view.verifiedNetSavings),
                },
              ]}
              insight={
                evaluationStatus === 'READY_TO_OPTIMIZE'
                  ? 'Evalomics has enough evaluation evidence to recommend a staged implementation.'
                  : evaluationStatus === 'KEEP_CURRENT'
                    ? 'The candidate did not justify a production change under the configured evidence constraints.'
                    : evaluationStatus === 'PROVEN'
                      ? 'Post-change production evidence supports the result.'
                      : 'Evalomics is still between detection and a safe implementation decision.'
              }
              nextStep={
                view.strongestAction?.nextAction ??
                'Continue collecting evidence; Evalomics will surface the next safe action.'
              }
              actionHref={`/o/${organizationId}/recommendations`}
              actionLabel="Open evaluation"
            >
              <article className="flex h-full flex-col rounded-[22px] border border-white/[0.10] bg-[#121316] p-5 font-mono">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
                  Evaluation status
                </p>
                <p className="mt-4 text-xl font-semibold tracking-[-0.03em] text-white">
                  {evaluationStatusLabel}
                </p>
                <p className="mt-2 font-mono text-[10px] text-slate-500">
                  Evalomics decision state
                </p>
                <div className="mt-auto grid gap-2 pt-5 text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Found</span>
                    <span
                      className={
                        view.strongestAction !== null
                          ? 'text-emerald-300'
                          : 'text-slate-600'
                      }
                    >
                      {view.strongestAction !== null ? 'yes' : 'pending'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Evaluated</span>
                    <span
                      className={
                        evaluationStatus === 'READY_TO_OPTIMIZE' ||
                        evaluationStatus === 'KEEP_CURRENT' ||
                        evaluationStatus === 'EVALUATED' ||
                        evaluationStatus === 'PROVEN'
                          ? 'text-emerald-300'
                          : 'text-slate-600'
                      }
                    >
                      {evaluationStatus === 'READY_TO_OPTIMIZE' ||
                      evaluationStatus === 'KEEP_CURRENT' ||
                      evaluationStatus === 'EVALUATED' ||
                      evaluationStatus === 'PROVEN'
                        ? 'yes'
                        : 'in progress'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Proven</span>
                    <span
                      className={
                        evaluationStatus === 'PROVEN'
                          ? 'text-emerald-300'
                          : 'text-slate-600'
                      }
                    >
                      {evaluationStatus === 'PROVEN' ? 'yes' : 'after rollout'}
                    </span>
                  </div>
                </div>
              </article>
            </DashboardDrilldown>

            <DashboardDrilldown
              eyebrow="Supporting evidence summary"
              title="Why Evalomics reached this result"
              summary="This view collects the supporting usage signals behind the recommendation so the customer can understand the decision without digging through raw records."
              items={view.diagnosticFacts.slice(0, 4).map((fact) => ({
                label: fact.label,
                value: fact.value,
              }))}
              insight="These facts are descriptive evidence from the selected source. They support the recommendation but do not by themselves prove production savings."
              nextStep="Use the detailed recommendation or proof view when you need the exact decision trail."
              actionHref={`/o/${organizationId}/recommendations`}
              actionLabel="Open recommendation evidence"
            >
              <section className="flex h-full flex-col overflow-auto rounded-[22px] border border-white/[0.10] bg-[#121316] p-5 font-mono sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
                      Supporting evidence summary
                    </p>
                    <h2 className="mt-2 font-mono text-base font-medium text-white">
                      Usage diagnosis · signals Evalomics can support
                    </h2>
                  </div>
                  <BadgeDollarSign className="size-4 text-sky-300/60" />
                </div>

                {view.diagnosticFacts.length > 0 ? (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {view.diagnosticFacts.slice(0, 4).map((fact) => (
                      <article
                        key={fact.label}
                        className="rounded-lg border border-white/[0.07] bg-black/20 p-4"
                      >
                        <p className="text-[10px] uppercase tracking-[0.12em] text-slate-600">
                          {fact.label}
                        </p>
                        <p className="mt-3 font-mono text-base text-slate-200">
                          {fact.value}
                        </p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="mt-5 text-sm text-slate-500">
                    No additional diagnostic facts are available for this
                    source.
                  </p>
                )}

                <div className="mt-5 flex flex-wrap gap-4">
                  <Link
                    href={`/o/${organizationId}/import`}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-sky-300 no-underline"
                  >
                    <Database className="size-3.5" />
                    Usage & Import
                  </Link>
                  <Link
                    href={`/o/${organizationId}/prompts`}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-violet-300 no-underline"
                  >
                    <Sparkles className="size-3.5" />
                    Prompt Optimizer
                  </Link>
                </div>
              </section>
            </DashboardDrilldown>
          </DashboardWidgetGrid>
        </>
      )}
    </div>
  );
}
