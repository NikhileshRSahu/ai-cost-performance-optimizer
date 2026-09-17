import Link from 'next/link';
import { redirect } from 'next/navigation';
import { buildAnalysisDepth } from '../../../../../src/efficiency/analysis-depth';
import { buildWorkMriSnapshot } from '../../../../../src/efficiency/work-mri';
import { formatDecimal, rational } from '../../../../../src/economics/exact';
import { createDatabase } from '../../../../../src/persistence/database';
import { buildFounderDashboardView } from '../../../../../src/workbench/dashboard-view';
import { ProofTimeline, type ProofStage } from '../../../components/proof-timeline';
import { RecommendationCard } from '../../../components/recommendation-card';
import { SignOutButton } from '../../../components/sign-out-button';
import { WorkMri } from '../../../components/work-mri';
import { hasSelfHostedAuthConfiguration } from '../../../lib/auth-config';
import { loadFounderDashboardEvidence } from '../../../lib/dashboard-data';
import { resolveRuntimeSession } from '../../../lib/runtime-session';

export const dynamic = 'force-dynamic';

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
}: Readonly<{ params: Promise<{ organizationId: string }> }>) {
  const { organizationId } = await params;
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

  const analysisDepth = buildAnalysisDepth(
    view.dataQuality === 'NO_DATA' ? [] : ['USAGE_CSV'],
  );
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
              : 'We analyzed your AI usage'}
          </h1>
          <p className="m-0 mt-3 max-w-3xl text-sm leading-6 text-white/50">
            {view.dataQuality === 'NO_DATA'
              ? 'Upload one useful usage window. Evalomics will find the strongest supported optimization and tell you what to do next.'
              : `Evidence window: ${view.periodLabel}. Here is the strongest answer your current evidence supports.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {view.dataQuality !== 'NO_DATA' ? (
            <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[10px] font-semibold text-white/55">
              Data quality · {view.dataQuality}
            </span>
          ) : null}
          {hasSelfHostedAuthConfiguration() ? <SignOutButton /> : null}
        </div>
      </header>

      {view.dataQuality === 'NO_DATA' ? (
        <section className="rounded-[22px] border border-dashed border-white/12 bg-white/[0.02] p-7">
          <h2 className="m-0 text-2xl font-semibold tracking-[-0.035em] text-white">
            Start with your usage data
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
            Upload a compatible CSV now. Provider connections can be added later;
            the product should already give you a useful answer from one clean
            evidence window.
          </p>
          <Link
            className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 no-underline transition hover:bg-slate-100"
            href={`/o/${organizationId}/import`}
          >
            Upload AI usage
          </Link>
        </section>
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
                <p className="m-0 mt-2 text-sm text-white/55">
                  Spend analyzed
                </p>
                <p className="m-0 mt-1 font-mono text-3xl font-medium tracking-[-0.04em] text-white">
                  {moneyLabel(view.observedSpend)}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3 text-left lg:min-w-56 lg:text-right">
                <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
                  Verified net saving
                </p>
                <p className="m-0 mt-1 font-mono text-xl font-medium text-white/88">
                  {verifiedMoney(view.verifiedNetSavings)}
                </p>
              </div>
            </div>

            {view.strongestAction === null ? (
              <div className="mt-2 rounded-2xl border border-dashed border-white/10 bg-white/[0.018] p-5">
                <h2 className="m-0 text-xl font-semibold text-white">
                  No supported optimization yet
                </h2>
                <p className="mt-2 text-sm leading-6 text-white/50">
                  Your data was analyzed, but there is not enough evidence yet to
                  recommend a change safely.
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
