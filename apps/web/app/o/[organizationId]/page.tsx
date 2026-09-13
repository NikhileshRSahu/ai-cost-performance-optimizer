import { redirect } from 'next/navigation';
import { buildFounderDashboardView } from '../../../../../src/workbench/dashboard-view.js';
import { createDatabase } from '../../../../../src/persistence/database.js';
import { MetricCard } from '../../../components/metric-card.js';
import { RecommendationCard } from '../../../components/recommendation-card.js';
import { DASHBOARD_COPY } from '../../../lib/dashboard-copy.js';
import { loadFounderDashboardEvidence } from '../../../lib/dashboard-data.js';
import { resolveRuntimeSession } from '../../../lib/runtime-session.js';

export const dynamic = 'force-dynamic';

function moneyLabel(
  value: Readonly<{ amount: string; currency: string }> | null,
): string {
  return value === null ? 'Unavailable' : `${value.currency} ${value.amount}`;
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

  const verified =
    view.verifiedNetSavings === null
      ? 'Not verified yet'
      : `${view.verifiedNetSavings.currency} ${view.verifiedNetSavings.exactNumerator}/${view.verifiedNetSavings.exactDenominator} · ${view.verifiedNetSavings.direction}`;

  return (
    <div className="dashboard-stack">
      {view.demoDisclaimer !== null ? (
        <div className="demo-banner" role="note">
          {view.demoDisclaimer}
        </div>
      ) : null}

      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Founder overview</p>
          <h1>{view.organizationName}</h1>
          <p className="lede">
            Evidence window: {view.periodLabel}. Potential, tested, and verified
            savings remain separate throughout the workflow.
          </p>
        </div>
        <span className="quality-chip">
          {DASHBOARD_COPY.dataQualityLabel}: {view.dataQuality}
        </span>
      </header>

      <div className="metrics-grid">
        <MetricCard
          label={DASHBOARD_COPY.observedSpendLabel}
          value={moneyLabel(view.observedSpend)}
          detail={
            view.observedSpend === null
              ? 'No trustworthy spend total is available for this period.'
              : 'Same-currency cost included from the selected evidence window.'
          }
        />
        <MetricCard
          label={DASHBOARD_COPY.verifiedSavingsLabel}
          value={verified}
          detail={
            view.verifiedNetSavings === null
              ? 'Requires implementation plus comparable post-change evidence.'
              : `Formula: ${view.verifiedNetSavings.formulaVersion}`
          }
        />
      </div>

      <section aria-labelledby="strongest-action-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{DASHBOARD_COPY.strongestActionLabel}</p>
            <h2 id="strongest-action-title">What should we test next?</h2>
          </div>
          <span className="projection-note">
            {view.monthlyProjectionAllowed
              ? '30-day projection eligible'
              : '30-day projection withheld'}
          </span>
        </div>
        {view.strongestAction === null ? (
          <div className="empty-state">
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
        <section className="limitations" aria-labelledby="limitations-title">
          <h2 id="limitations-title">Evidence limitations</h2>
          <ul>
            {view.limitations.map((limitation) => (
              <li key={limitation}>{limitation}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
