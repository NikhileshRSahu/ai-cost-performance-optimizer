import Link from 'next/link';
import { redirect } from 'next/navigation';
import { buildAnalysisDepth } from '../../../../../src/efficiency/analysis-depth';
import { buildWorkMriSnapshot } from '../../../../../src/efficiency/work-mri';
import { formatDecimal, rational } from '../../../../../src/economics/exact';
import { createDatabase } from '../../../../../src/persistence/database';
import { buildFounderDashboardView } from '../../../../../src/workbench/dashboard-view';
import {
  ProofTimeline,
  type ProofStage,
} from '../../../components/proof-timeline';
import { RecommendationCard } from '../../../components/recommendation-card';
import { SignOutButton } from '../../../components/sign-out-button';
import { WorkMri } from '../../../components/work-mri';
import { SourceChoiceCard } from '../../../components/workbench/source-choice-card';
import { ResultJourney } from '../../../components/workbench/result-journey';
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

export default async function FounderDashboardPage({
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
  const selection = dashboardSelection(query);
  const session = await resolveRuntimeSession();
  const databaseUrl = process.env.DATABASE_URL;
  if (session === null || databaseUrl === undefined) redirect('/unauthorized');

  const database = createDatabase(databaseUrl);
  let view;
  try {
    const evidence = await loadFounderDashboardEvidence(
      database.db,
      session,
      organizationId,
      selection,
    );
    view = buildFounderDashboardView(evidence);
  } finally {
    await database.close();
  }

  const proofStage: ProofStage =
    view.verifiedNetSavings !== null
      ? 'Verified'
      : view.strongestAction?.state === 'TESTED'
        ? 'Tested'
        : view.strongestAction !== null
          ? 'Opportunity'
          : 'Observed';

  const analysisSources =
    view.dataQuality === 'NO_DATA'
      ? []
      : view.sourceKind === 'PROVIDER'
        ? (['PROVIDER_ADMIN_USAGE'] as const)
        : (['USAGE_CSV'] as const);
  const analysisDepth = buildAnalysisDepth(analysisSources);
  const mri = buildWorkMriSnapshot({
    depth: analysisDepth,
    additionalFacts: view.diagnosticFacts,
    observedSpend: view.observedSpend,
    strongestAction: null,
    verifiedNetSavings:
      view.verifiedNetSavings === null
        ? null
        : {
            numerator: view.verifiedNetSavings.exactNumerator,
            denominator: view.verifiedNetSavings.exactDenominator,
            currency: view.verifiedNetSavings.currency,
            evidenceRef: view.verifiedNetSavings.evidenceRef,
          },
  });

  const journeyStage =
    view.strongestAction?.state === 'VERIFIED'
      ? 'Verified'
      : view.strongestAction?.state === 'TESTED'
        ? 'Tested'
        : view.strongestAction !== null
          ? 'Finding'
          : 'Observed';

  const resultLabel =
    view.strongestAction?.state === 'VERIFIED'
      ? 'Verified improvement'
      : view.strongestAction?.state === 'TESTED'
        ? 'Best tested improvement'
        : view.strongestAction?.state === 'OPPORTUNITY'
          ? 'Best opportunity found'
          : 'Analysis ready';

  return (
    <div className="grid gap-6">
      {view.demoDisclaimer !== null ? (
        <div
          className="rounded-xl border border-amber-300/20 bg-amber-300/[0.07] px-4 py-3 text-xs font-semibold text-amber-100/75"
          role="note"
        >
          {view.demoDisclaimer}
        </div>
      ) : null}

      <header className="flex flex-col gap-5 border-b border-white/[0.07] pb-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.17em] text-blue-200/55">
            Evalomics analysis
          </p>
          <h1 className="m-0 mt-2 !text-[clamp(2.3rem,5vw,4.2rem)] !leading-[.98] !tracking-[-.055em] text-white">
            {view.dataQuality === 'NO_DATA'
              ? 'Give Evalomics your AI usage'
              : view.dataQuality === 'ZERO_USAGE' &&
                  view.sourceKind === 'PROVIDER'
                ? `${view.providerName ?? 'Provider'} connected`
                : 'We analyzed your AI usage'}
          </h1>
          <p className="m-0 mt-3 max-w-3xl text-sm leading-6 text-white/50">
            {view.dataQuality === 'NO_DATA'
              ? 'Connect OpenAI or Anthropic, upload a compatible CSV, or try the demo. Evalomics analyzes the source automatically and returns one clear result.'
              : view.dataQuality === 'ZERO_USAGE' &&
                  view.sourceKind === 'PROVIDER'
                ? `Connection succeeded. No API usage or cost records were returned for ${view.periodLabel}.`
                : `Evidence window: ${view.periodLabel}. Here is the strongest answer your current evidence supports.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {view.dataQuality !== 'NO_DATA' ? (
            <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[10px] font-semibold text-white/55">
              {view.dataQuality === 'ZERO_USAGE' &&
              view.sourceKind === 'PROVIDER'
                ? 'No API usage found'
                : `Data quality · ${view.dataQuality}`}
            </span>
          ) : null}
          {hasSelfHostedAuthConfiguration() ? <SignOutButton /> : null}
        </div>
      </header>

      {view.dataQuality !== 'NO_DATA' && !(view.dataQuality === 'ZERO_USAGE' && view.sourceKind === 'PROVIDER') ? (
        <ResultJourney current={journeyStage} />
      ) : null}

      {view.dataQuality === 'NO_DATA' ? (
        <section className="grid gap-5">
          <div className="max-w-3xl">
            <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-200/55">
              Choose a source
            </p>
            <h2 className="m-0 mt-2 text-2xl font-semibold tracking-[-0.035em] text-white sm:text-3xl">
              Give Evalomics one usage source
            </h2>
            <p className="m-0 mt-3 text-sm leading-6 text-white/50">
              Pick the easiest path. Evalomics handles the analysis
              automatically and sends you back here with the strongest supported
              answer.
            </p>
          </div>

          <div
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
            aria-label="AI usage source choices"
          >
            <SourceChoiceCard
              kind="OPENAI"
              title="OpenAI"
              description="Read organization API usage and cost reports. Prompt and response text are not requested."
              meta="Admin API beta · 7-day evidence window"
              href={`/o/${organizationId}/import`}
              actionLabel="Connect OpenAI"
            />
            <SourceChoiceCard
              kind="ANTHROPIC"
              title="Anthropic"
              description="Read organization API usage and cost reports. Consumer Claude app activity is separate."
              meta="Admin API beta · 7-day evidence window"
              href={`/o/${organizationId}/import`}
              actionLabel="Connect Anthropic"
            />
            <SourceChoiceCard
              kind="CSV"
              title="Upload CSV"
              description="Use an existing usage export when a provider connection is not the right path."
              meta="Up to 10 MiB · 50,000 rows"
              href={`/o/${organizationId}/import`}
              actionLabel="Choose a usage file"
            />
            <SourceChoiceCard
              kind="DEMO"
              title="Try demo"
              description="Run synthetic usage through the same analysis path and see the result before using customer data."
              meta="Synthetic · never customer proof"
              href={`/o/${organizationId}/import`}
              actionLabel="Open the demo"
            />
          </div>

          <p className="m-0 text-xs leading-5 text-white/38">
            Provider connections use API-platform evidence. ChatGPT and Claude
            consumer subscription activity is not included in these connectors.
          </p>
        </section>
      ) : view.dataQuality === 'ZERO_USAGE' &&
        view.sourceKind === 'PROVIDER' ? (
        <>
          <section
            className="grid gap-5 rounded-[22px] border border-white/[0.08] bg-[#0a0f16] p-6 shadow-[0_24px_70px_rgba(0,0,0,.18)]"
            data-testid="provider-zero-usage"
          >
            <div>
              <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200/65">
                Connection ready
              </p>
              <h2 className="m-0 mt-2 text-2xl font-semibold tracking-[-0.035em] text-white">
                No API usage found in this window
              </h2>
              <p className="m-0 mt-3 max-w-3xl text-sm leading-6 text-white/52">
                Evalomics successfully connected to{' '}
                {view.providerName ?? 'your provider'}, but the provider
                returned no usage or cost records for this seven-day window.
                There is nothing to optimize yet.
              </p>
              {view.providerName === 'OpenAI' ? (
                <p className="m-0 mt-2 max-w-3xl text-xs leading-5 text-white/40">
                  ChatGPT app usage is separate from OpenAI API Platform usage,
                  so ChatGPT conversations do not appear in this connector.
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                className="inline-flex min-h-11 items-center rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 no-underline"
                href={`/o/${organizationId}/import`}
              >
                Check again
              </Link>
              <Link
                className="inline-flex min-h-11 items-center rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white no-underline"
                href={`/o/${organizationId}/import`}
              >
                Upload CSV or try demo
              </Link>
            </div>
          </section>

          <details className="group rounded-[22px] border border-white/[0.07] bg-white/[0.018]">
            <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-white/78 sm:px-6">
              See connection details
            </summary>
            <div className="border-t border-white/[0.07] p-5 sm:p-6">
              <ul className="m-0 grid gap-2 pl-5 text-xs leading-5 text-white/55">
                {view.limitations.map((limitation) => (
                  <li key={limitation}>{limitation}</li>
                ))}
              </ul>
            </div>
          </details>
        </>
      ) : (
        <>
          <section
            className="grid gap-3 rounded-[22px] border border-white/[0.08] bg-[#0a0f16] p-5 shadow-[0_24px_70px_rgba(0,0,0,.18)] sm:p-6"
            data-testid="direct-answer-result"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-200/60">
                  {resultLabel}
                </p>
                <p className="m-0 mt-2 text-sm text-white/55">Spend analyzed</p>
                <p className="m-0 mt-1 font-mono text-3xl font-medium tracking-[-0.04em] text-white">
                  {moneyLabel(view.observedSpend)}
                </p>
              </div>
              {view.verifiedNetSavings !== null ? (
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3 text-left lg:min-w-56 lg:text-right">
                  <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
                    Verified net saving
                  </p>
                  <p className="m-0 mt-1 font-mono text-xl font-medium text-white/88">
                    {verifiedMoney(view.verifiedNetSavings)}
                  </p>
                </div>
              ) : null}
            </div>

            {view.strongestAction === null ? (
              <div className="mt-2 rounded-2xl border border-dashed border-white/10 bg-white/[0.018] p-5">
                <h2 className="m-0 text-xl font-semibold text-white">
                  No supported optimization yet
                </h2>
                <p className="mt-2 text-sm leading-6 text-white/50">
                  Your data was analyzed, but there is not enough evidence yet
                  to recommend a change safely.
                </p>
                <Link
                  className="mt-4 inline-flex min-h-10 items-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white no-underline"
                  href={`/o/${organizationId}/import`}
                >
                  Add more data
                </Link>
              </div>
            ) : (
              <RecommendationCard
                organizationId={organizationId}
                recommendation={view.strongestAction}
              />
            )}
          </section>

          <details
            className="group rounded-[22px] border border-white/[0.07] bg-white/[0.018]"
            data-testid="analysis-details"
          >
            <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-white/78 sm:px-6">
              See details
            </summary>
            <div className="grid gap-6 border-t border-white/[0.07] p-5 sm:p-6">
              <section>
                <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                  Analysis status
                </p>
                <div className="mt-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
                  <ProofTimeline current={proofStage} />
                </div>
              </section>

              <WorkMri snapshot={mri} />

              {view.limitations.length > 0 ? (
                <details className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
                  <summary className="cursor-pointer text-sm font-semibold text-white/72">
                    Evidence limitations
                  </summary>
                  <ul className="mt-3 grid gap-1.5 pl-5 text-xs leading-5 text-white/55">
                    {view.limitations.map((limitation) => (
                      <li key={limitation}>{limitation}</li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </div>
          </details>
        </>
      )}
    </div>
  );
}
