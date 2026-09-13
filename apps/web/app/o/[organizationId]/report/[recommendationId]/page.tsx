import { redirect } from 'next/navigation';
import { createDatabase } from '../../../../../../../src/persistence/database';
import { buildOptimizationReportView } from '../../../../../../../src/reports/report-view';
import { PrintReportButton } from '../../../../../components/print-report-button';
import { loadOptimizationReportEvidence } from '../../../../../lib/report-data';
import { resolveRuntimeSession } from '../../../../../lib/runtime-session';
import './print.css';

export const dynamic = 'force-dynamic';

function FinancialClaim({
  claim,
}: Readonly<{
  claim: ReturnType<
    typeof buildOptimizationReportView
  >['financialClaims'][number];
}>) {
  return (
    <article className="report-claim">
      <h3>{claim.label}</h3>
      <dl>
        <div>
          <dt>Amount</dt>
          <dd>
            {claim.currency} {claim.amount}
          </dd>
        </div>
        <div>
          <dt>State</dt>
          <dd>{claim.state}</dd>
        </div>
        <div>
          <dt>Horizon</dt>
          <dd>{claim.horizon}</dd>
        </div>
        <div>
          <dt>Evidence</dt>
          <dd>{claim.evidenceRef}</dd>
        </div>
        <div>
          <dt>Formula</dt>
          <dd>{claim.formulaVersion}</dd>
        </div>
      </dl>
    </article>
  );
}

export default async function OptimizationReportPage({
  params,
}: Readonly<{
  params: Promise<{ organizationId: string; recommendationId: string }>;
}>) {
  const { organizationId, recommendationId } = await params;
  const session = await resolveRuntimeSession();
  const databaseUrl = process.env.DATABASE_URL;
  if (session === null || databaseUrl === undefined) redirect('/unauthorized');

  const database = createDatabase(databaseUrl);
  let view;
  try {
    view = buildOptimizationReportView(
      await loadOptimizationReportEvidence(
        database.db,
        session,
        organizationId,
        recommendationId,
      ),
    );
  } finally {
    await database.close();
  }

  return (
    <article className="report-shell">
      <div className="report-toolbar" aria-label="Report actions">
        <PrintReportButton />
      </div>

      {view.demoDisclaimer !== null ? (
        <div className="report-disclaimer" role="note">
          {view.demoDisclaimer}
        </div>
      ) : null}

      <header className="report-cover">
        <p className="eyebrow">Optimization evidence report</p>
        <h1>{view.organizationName}</h1>
        <p className="lede">{view.reportPeriod}</p>
        <dl className="report-meta">
          <div>
            <dt>Data quality</dt>
            <dd>{view.dataQuality}</dd>
          </div>
          <div>
            <dt>Methodology</dt>
            <dd>{view.methodologyVersion}</dd>
          </div>
        </dl>
      </header>

      <section id="executive-summary" className="report-section">
        <h2>Executive summary</h2>
        <p>
          Decision: <strong>{view.benchmark.decision}</strong>. Savings states
          remain separated between observed, opportunity, tested, and verified
          evidence.
        </p>
        <div className="report-claims">
          {view.financialClaims.map((claim) => (
            <FinancialClaim
              key={`${claim.label}:${claim.evidenceRef}`}
              claim={claim}
            />
          ))}
        </div>
      </section>

      <section id="scope-data-quality" className="report-section">
        <h2>Scope and data quality</h2>
        <p>Evidence window: {view.reportPeriod}</p>
        <p>Data quality: {view.dataQuality}</p>
      </section>

      <section id="opportunity" className="report-section">
        <h2>Opportunity</h2>
        <dl>
          <div>
            <dt>Measured fact</dt>
            <dd>{view.opportunity.measuredFact}</dd>
          </div>
          <div>
            <dt>Inference</dt>
            <dd>{view.opportunity.inference}</dd>
          </div>
          <div>
            <dt>Hypothesis</dt>
            <dd>{view.opportunity.hypothesis}</dd>
          </div>
          <div>
            <dt>Savings state</dt>
            <dd>{view.opportunity.savingState}</dd>
          </div>
        </dl>
      </section>

      <section id="benchmark" className="report-section">
        <h2>Benchmark</h2>
        <p>
          {view.benchmark.currentConfiguration} →{' '}
          {view.benchmark.candidateConfiguration}
        </p>
        <ul>
          {view.benchmark.constraintSummary.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section id="economics" className="report-section">
        <h2>Economics</h2>
        <p>
          Financial claims above include their currency, evidence state,
          comparison horizon, evidence reference, and formula version.
        </p>
      </section>

      <section id="confidence" className="report-section">
        <h2>Confidence</h2>
        <p>Band: {view.confidence.band}</p>
        <ul>
          {view.confidence.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </section>

      <section id="implementation" className="report-section">
        <h2>Implementation and rollback</h2>
        <p>{view.implementation.proposedChange}</p>
        <ul>
          {view.implementation.rollbackInstructions.map((instruction) => (
            <li key={instruction}>{instruction}</li>
          ))}
        </ul>
      </section>

      <section id="verification" className="report-section">
        <h2>Verification</h2>
        <p>Status: {view.verification.status}</p>
        <p>{view.verification.summary}</p>
      </section>

      <section id="methodology-limitations" className="report-section">
        <h2>Methodology and limitations</h2>
        <p>Methodology version: {view.methodologyVersion}</p>
        {view.limitations.length === 0 ? (
          <p>No additional limitation was recorded.</p>
        ) : (
          <ul>
            {view.limitations.map((limitation) => (
              <li key={limitation}>{limitation}</li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}
