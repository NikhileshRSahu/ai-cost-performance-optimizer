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
            Cost dashboard
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-100 sm:text-3xl">
            Bring your first usage window into focus.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Connect a supported provider or upload a CSV. Once evidence exists,
            this page becomes the compact cost dashboard.
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

      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
              ● Cost intelligence
            </span>
            <span className="font-mono text-[11px] text-slate-500">
              {view.periodLabel}
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-[-0.04em] text-slate-100 sm:text-3xl">
            Cost Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            One screen for spend, supported opportunities, and proof state.
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
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: 'Observed AI spend',
                value: moneyLabel(view.observedSpend),
                detail:
                  view.sourceKind === 'PROVIDER'
                    ? (view.providerName ?? 'Provider')
                    : view.sourceKind,
                tone: 'text-sky-300',
              },
              {
                label: 'Savings signals',
                value: String(view.recommendations.length),
                detail: 'ranked recommendations',
                tone: 'text-slate-100',
              },
              {
                label: 'Modeled upside',
                value: modeled,
                detail: 'planning evidence only',
                tone: 'text-emerald-300',
              },
              {
                label: 'Verified savings',
                value: verifiedMoney(view.verifiedNetSavings),
                detail: 'production evidence',
                tone: 'text-violet-300',
              },
            ].map(({ label, value, detail, tone }) => (
              <article
                key={label}
                className="rounded-xl border border-white/[0.07] bg-[#111a29] p-5"
              >
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                  {label}
                </p>
                <p className={`mt-4 font-mono text-2xl ${tone}`}>{value}</p>
                <p className="mt-2 text-[10px] text-slate-600">{detail}</p>
              </article>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
            <div className="rounded-xl border border-white/[0.07] bg-[#111a29] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-emerald-300/70">
                    Top recommendation
                  </p>
                  <h2 className="mt-2 text-base font-medium text-slate-100">
                    Strongest supported action
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
            </div>

            <div className="rounded-xl border border-white/[0.07] bg-[#111a29] p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-violet-300" />
                <h2 className="text-sm font-medium text-slate-100">
                  Evidence status
                </h2>
              </div>
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
                      <p className="mt-1 text-[10px] text-slate-600">
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
                Open verified savings <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </section>

          <section className="rounded-xl border border-white/[0.07] bg-[#111a29] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                  Usage diagnosis
                </p>
                <h2 className="mt-2 text-base font-medium text-slate-100">
                  Signals Evalomics can support
                </h2>
              </div>
              <BadgeDollarSign className="size-4 text-sky-300/60" />
            </div>

            {view.diagnosticFacts.length > 0 ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {view.diagnosticFacts.slice(0, 4).map((fact) => (
                  <article
                    key={fact.label}
                    className="rounded-lg border border-white/[0.06] bg-[#0c1421] p-4"
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
        </>
      )}
    </div>
  );
}
