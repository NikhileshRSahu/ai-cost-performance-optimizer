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
import { RecommendationCard } from '../../../components/recommendation-card';
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
  if (value === null) return 'Not verified';
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
          style={{ height: `${Math.max(14, value)}%`, width: '100%' }}
        />
      ))}
    </div>
  );
}

function EvidenceHeat({ active }: Readonly<{ active: number }>) {
  return (
    <div
      className="mt-5 grid grid-cols-12 gap-1"
      aria-label={`${active} evidence stages active`}
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

  const modeled =
    view.nonOverlappingModeledTotal === null
      ? 'Not measured'
      : `${view.nonOverlappingModeledTotal.currency} ${view.nonOverlappingModeledTotal.base}`;

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
              { id: 'modeled', size: 'sm', label: 'Modeled upside' },
              { id: 'verified', size: 'sm', label: 'Verified savings' },
              { id: 'diagnosis', size: 'lg', label: 'Usage diagnosis' },
            ]}
          >
            <section className="flex h-full flex-col rounded-[22px] border border-white/[0.10] bg-[#121316] p-5 font-mono sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
                    Recommended action
                  </p>
                  <h2 className="mt-2 font-mono text-base font-medium text-white">
                    {view.strongestAction?.state === 'TESTED'
                      ? 'Best tested improvement'
                      : view.strongestAction?.state === 'VERIFIED'
                        ? 'Best verified improvement'
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
                    'Optimization detected',
                    view.strongestAction !== null,
                  ],
                  [
                    'Tested',
                    'Benchmark-supported',
                    view.strongestAction?.state === 'TESTED' ||
                      view.strongestAction?.state === 'VERIFIED',
                  ],
                  [
                    'Verified',
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
                  ? 'View proof status'
                  : 'Open verified savings'}{' '}
                <ArrowRight className="size-3.5" />
              </Link>
            </section>

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

            <article className="rounded-xl border border-white/[0.07] bg-[#111a29] p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
                Modeled upside
              </p>
              <p className="mt-4 font-mono text-3xl tracking-[-0.04em] text-white">
                {modeled}
              </p>
              <p className="mt-2 font-mono text-[10px] text-slate-500">
                planning evidence only
              </p>
              <ConsoleBars
                values={[24, 31, 27, 39, 36, 48, 44, 52, 57, 61, 68, 74]}
                accent="bg-amber-300"
              />
            </article>

            <article className="rounded-xl border border-white/[0.07] bg-[#111a29] p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
                Verified savings
              </p>
              <p className="mt-4 font-mono text-3xl tracking-[-0.04em] text-white">
                {verifiedMoney(view.verifiedNetSavings)}
              </p>
              <p className="mt-2 font-mono text-[10px] text-slate-500">
                production evidence
              </p>
              <ConsoleBars
                values={[16, 16, 18, 18, 20, 20, 22, 23, 23, 25, 26, 28]}
                accent="bg-violet-300"
              />
            </article>

            <section className="flex h-full flex-col overflow-auto rounded-[22px] border border-white/[0.10] bg-[#121316] p-5 font-mono sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
                    Usage diagnosis
                  </p>
                  <h2 className="mt-2 font-mono text-base font-medium text-white">
                    Signals Evalomics can support
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
                  No additional diagnostic facts are available for this source.
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
          </DashboardWidgetGrid>
        </>
      )}
    </div>
  );
}
