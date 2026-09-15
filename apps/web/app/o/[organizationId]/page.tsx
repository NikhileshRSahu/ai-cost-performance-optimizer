import {
  Activity,
  CircleDollarSign,
  FlaskConical,
  ShieldCheck,
} from 'lucide-react';
import { redirect } from 'next/navigation';
import { buildAnalysisDepth } from '../../../../../src/efficiency/analysis-depth';
import { buildWorkMriSnapshot } from '../../../../../src/efficiency/work-mri';
import { formatDecimal, rational } from '../../../../../src/economics/exact';
import { createDatabase } from '../../../../../src/persistence/database';
import { buildFounderDashboardView } from '../../../../../src/workbench/dashboard-view';
import { MetricTile } from '../../../components/metric-tile';
import {
  ProofTimeline,
  type ProofStage,
} from '../../../components/proof-timeline';
import { RecommendationCard } from '../../../components/recommendation-card';
import { SignOutButton } from '../../../components/sign-out-button';
import { WorkMri } from '../../../components/work-mri';
import {
  WorkflowProgress,
  type WorkflowStep,
} from '../../../components/workflow-progress';
import { hasNeonAuthConfiguration } from '../../../lib/neon-auth';
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

  const currentStep: WorkflowStep =
    view.verifiedNetSavings !== null
      ? 'verify'
      : view.strongestAction?.state === 'TESTED'
        ? 'implement'
        : view.strongestAction !== null
          ? 'benchmark'
          : view.observedSpend !== null
            ? 'workloads'
            : 'import';

  const proofStage: ProofStage =
    view.verifiedNetSavings !== null
      ? 'Verified'
      : view.strongestAction?.state === 'TESTED'
        ? 'Tested'
        : view.strongestAction !== null
          ? 'Opportunity'
          : view.observedSpend !== null
            ? 'Observed'
            : 'Observed';

  const analysisDepth = buildAnalysisDepth(
    view.dataQuality === 'NO_DATA' ? [] : ['USAGE_CSV'],
  );
  const mri = buildWorkMriSnapshot({
    depth: analysisDepth,
    additionalFacts: view.diagnosticFacts,
    observedSpend: view.observedSpend,
    strongestAction:
      view.strongestAction === null
        ? null
        : {
            title: view.strongestAction.title,
            state: view.strongestAction.state,
            confidenceBand: view.strongestAction.confidenceBand,
            saving: view.strongestAction.saving,
            principalLimitation: view.strongestAction.principalLimitation,
            nextAction: view.strongestAction.nextAction,
          },
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

  const potential =
    view.strongestAction?.state === 'OPPORTUNITY'
      ? moneyLabel(view.strongestAction.saving)
      : 'Not active';
  const tested =
    view.strongestAction?.state === 'TESTED' ||
    view.strongestAction?.state === 'VERIFIED'
      ? moneyLabel(view.strongestAction.saving)
      : 'Not tested';

  return (
    <div className="grid gap-6">
      <WorkflowProgress organizationId={organizationId} current={currentStep} />

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
          <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.17em] text-white/28">
            Work MRI overview
          </p>
          <h1 className="m-0 mt-2 !text-[clamp(2.4rem,5vw,4.4rem)] !leading-[.98] !tracking-[-.06em] text-white">
            {view.organizationName}
          </h1>
          <p className="m-0 mt-3 max-w-3xl text-sm leading-6 text-white/38">
            Evidence window: {view.periodLabel}. Potential, tested, and verified
            savings remain separate throughout the workflow.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[10px] font-semibold text-white/45">
            Data quality · {view.dataQuality}
          </span>
          {hasNeonAuthConfiguration() ? <SignOutButton /> : null}
        </div>
      </header>

      <section
        className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Evidence state metrics"
      >
        <MetricTile
          label="Observed spend"
          value={moneyLabel(view.observedSpend)}
          detail="Provider/customer evidence in selected window"
          tone="evidence"
          icon={<CircleDollarSign className="size-4" />}
        />
        <MetricTile
          label="Potential saving"
          value={potential}
          detail="Opportunity only · not counted as achieved"
          tone="potential"
          icon={<Activity className="size-4" />}
        />
        <MetricTile
          label="Tested saving"
          value={tested}
          detail="Candidate cleared benchmark constraints"
          tone="neutral"
          icon={<FlaskConical className="size-4" />}
        />
        <MetricTile
          label="Verified net saving"
          value={verifiedMoney(view.verifiedNetSavings)}
          detail={
            view.verifiedNetSavings === null
              ? 'Requires comparable post-change evidence'
              : `Formula: ${view.verifiedNetSavings.formulaVersion}`
          }
          tone="verified"
          icon={<ShieldCheck className="size-4" />}
        />
      </section>

      <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/28">
              Evidence progression
            </p>
            <p className="m-0 mt-1 text-xs text-white/38">
              A saving only becomes Verified after implementation and comparable
              post-change evidence.
            </p>
          </div>
          <span className="hidden rounded-full border border-white/10 bg-white/[0.035] px-3 py-1 text-[10px] font-semibold text-white/40 sm:inline-flex">
            {proofStage}
          </span>
        </div>
        <ProofTimeline current={proofStage} />
      </section>

      {view.dataQuality === 'NO_DATA' ? (
        <section className="rounded-[22px] border border-dashed border-white/12 bg-white/[0.02] p-7">
          <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-200/55">
            No production evidence yet
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-white">
            Give Evalomics one trustworthy evidence window.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/38">
            Import a usage CSV to unlock cost diagnostics and the first Work
            MRI. Missing values are never silently treated as zero.
          </p>
        </section>
      ) : (
        <WorkMri snapshot={mri} />
      )}

      <section aria-labelledby="strongest-action-title">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/28">
              Ranked next action
            </p>
            <h2
              id="strongest-action-title"
              className="m-0 mt-1.5 text-2xl font-semibold tracking-[-0.035em] text-white"
            >
              What should we test next?
            </h2>
          </div>
          <span className="w-fit rounded-full border border-white/10 bg-white/[0.035] px-3 py-1 text-[10px] font-semibold text-white/40">
            {view.monthlyProjectionAllowed
              ? '30-day projection eligible'
              : '30-day projection withheld'}
          </span>
        </div>

        {view.strongestAction === null ? (
          <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.02] p-5 text-sm leading-6 text-white/38">
            No rank-1 recommendation is available with enough evidence to claim
            a strongest action.
          </div>
        ) : (
          <RecommendationCard
            organizationId={organizationId}
            recommendation={view.strongestAction}
          />
        )}
      </section>

      {view.limitations.length > 0 ? (
        <section
          className="rounded-2xl border border-amber-300/12 bg-amber-300/[0.035] p-5"
          aria-labelledby="limitations-title"
        >
          <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-200/48">
            Evidence boundaries
          </p>
          <h2
            id="limitations-title"
            className="mt-2 text-lg font-semibold text-amber-50/82"
          >
            Limitations kept visible
          </h2>
          <ul className="mt-3 grid gap-1.5 pl-5 text-xs leading-5 text-amber-50/45">
            {view.limitations.map((limitation) => (
              <li key={limitation}>{limitation}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
