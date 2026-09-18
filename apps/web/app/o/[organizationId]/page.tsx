import { redirect } from 'next/navigation';
import { Database, FileSpreadsheet, Sparkles } from 'lucide-react';
import { formatDecimal, rational } from '../../../../../src/economics/exact';
import { createDatabase } from '../../../../../src/persistence/database';
import { buildFounderDashboardView } from '../../../../../src/workbench/dashboard-view';
import { RecommendationCard } from '../../../components/recommendation-card';
import { DirectResult } from '../../../components/workbench/direct-result';
import { EvidenceDetails } from '../../../components/workbench/evidence-details';
import { EvalButton } from '../../../components/ui/eval-button';
import { EvalSurface } from '../../../components/ui/eval-surface';
import { EvidenceBadge, type EvidenceState } from '../../../components/ui/evidence-badge';
import { StatusBanner } from '../../../components/ui/status-banner';
import {
  loadFounderDashboardEvidence,
  type DashboardSelection,
} from '../../../lib/dashboard-data';
import { resolveRuntimeSession } from '../../../lib/runtime-session';

export const dynamic = 'force-dynamic';

function dashboardSelection(
  input: Readonly<{ source?: string; importId?: string; provider?: string }>,
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
  searchParams: Promise<{ source?: string; importId?: string; provider?: string }>;
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
      <div className="space-y-6">
        <section>
          <EvidenceBadge state="OBSERVED" label="No usage connected yet" />
          <h1 className="mt-4 max-w-3xl text-[clamp(2.4rem,5vw,4.8rem)] font-semibold leading-[.94] tracking-[-0.055em] text-white">
            Give Evalomics usage. Get one clear next action.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/45">
            Connect OpenAI or Anthropic, or upload a CSV. Analysis starts from
            evidence and lands on a direct result instead of an empty dashboard.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <EvalSurface tone="raised" className="p-6">
            <Database className="size-5 text-cyan-300" />
            <h2 className="mt-8 text-xl font-medium text-white">Connect provider</h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-white/40">
              Use OpenAI or Anthropic Admin API usage and cost evidence.
            </p>
            <EvalButton
              href={`/o/${organizationId}/import?mode=connect`}
              className="mt-7"
            >
              Connect source
            </EvalButton>
          </EvalSurface>

          <EvalSurface tone="verified" className="p-6">
            <FileSpreadsheet className="size-5 text-[var(--eval-verified)]" />
            <h2 className="mt-8 text-xl font-medium text-white">Upload usage CSV</h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-white/40">
              Validate an existing export and run the same analysis path.
            </p>
            <EvalButton
              href={`/o/${organizationId}/import?mode=csv`}
              className="mt-7"
            >
              Upload data
            </EvalButton>
          </EvalSurface>
        </section>
      </div>
    );
  }

  if (view.dataQuality === 'ZERO_USAGE' && view.sourceKind === 'PROVIDER') {
    return (
      <div className="space-y-6">
        <StatusBanner
          tone="success"
          title={`${view.providerName ?? 'Provider'} connected successfully`}
          detail="The connection is ready, but this period returned no usage or cost records."
        />
        <EvalSurface tone="raised" className="p-6">
          <h1 className="text-2xl font-semibold tracking-[-0.04em] text-white">
            No API usage found in this window.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">
            Nothing is wrong with the connection. Change the source or import a
            usage file with activity to generate a result.
          </p>
          <EvalButton href={`/o/${organizationId}/import`} className="mt-6">
            Check source
          </EvalButton>
        </EvalSurface>
      </div>
    );
  }

  const strongest = view.strongestAction;
  const strongestState: EvidenceState =
    strongest?.state === 'VERIFIED'
      ? 'VERIFIED'
      : strongest?.state === 'TESTED'
        ? 'TESTED'
        : 'POTENTIAL';
  const testedSavings =
    strongest !== null &&
    (strongest.state === 'TESTED' || strongest.state === 'VERIFIED') &&
    strongest.saving !== null
      ? `${strongest.saving.currency} ${strongest.saving.amount}`
      : 'Not tested';

  const strongestAction =
    strongest === null ? (
      <EvalSurface tone="subtle" className="p-5">
        <Sparkles className="size-5 text-white/25" />
        <p className="mt-4 text-sm font-medium text-white/72">
          No supported optimization yet.
        </p>
        <p className="mt-2 text-xs leading-5 text-white/36">
          Add more evidence before changing production behavior.
        </p>
      </EvalSurface>
    ) : (
      <RecommendationCard
        organizationId={organizationId}
        recommendation={strongest}
      />
    );

  return (
    <div className="space-y-6">
      {view.demoDisclaimer !== null ? (
        <StatusBanner
          tone="warning"
          title="Demo evidence"
          detail={view.demoDisclaimer}
        />
      ) : null}

      <DirectResult
        periodLabel={view.periodLabel}
        observedSpend={moneyLabel(view.observedSpend)}
        observedSource={view.providerName ?? view.sourceKind}
        modeledUpside={modeled}
        testedSavings={testedSavings}
        verifiedSavings={verifiedMoney(view.verifiedNetSavings)}
        confidence={strongest?.detectionConfidence ?? 'Insufficient evidence'}
        strongestAction={strongestAction}
        strongestState={strongestState}
        recommendationsHref={`/o/${organizationId}/recommendations`}
        proofHref={`/o/${organizationId}/proof`}
      />

      <EvidenceDetails
        source={view.providerName ?? view.sourceKind}
        periodLabel={view.periodLabel}
        facts={view.diagnosticFacts}
        limitation={strongest?.principalLimitation ?? null}
      />
    </div>
  );
}
