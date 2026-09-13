import { redirect } from 'next/navigation';
import { createDatabase } from '../../../../../../../src/persistence/database';
import { buildOptimizationLabView } from '../../../../../../../src/workbench/lab-view';
import { ConstraintRow } from '../../../../../components/constraint-row';
import { EvidenceDetails } from '../../../../../components/evidence-details';
import { LAB_COPY } from '../../../../../lib/lab-copy';
import { loadOptimizationLabEvidence } from '../../../../../lib/lab-data';
import { resolveRuntimeSession } from '../../../../../lib/runtime-session';

export const dynamic = 'force-dynamic';

function metric(value: string | null): string {
  return value ?? 'Unavailable';
}

export default async function OptimizationLabPage({
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
    const evidence = await loadOptimizationLabEvidence(
      database.db,
      session,
      organizationId,
      recommendationId,
    );
    view = buildOptimizationLabView(evidence);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === 'LAB_EVIDENCE_INCOMPLETE' ||
        error.message === 'RECOMMENDATION_NOT_FOUND')
    ) {
      return (
        <section
          className="empty-state"
          aria-labelledby="lab-unavailable-title"
        >
          <p className="eyebrow">{LAB_COPY.heading}</p>
          <h1 id="lab-unavailable-title">Insufficient benchmark evidence</h1>
          <p>
            This recommendation does not have the complete
            current-versus-candidate evidence required for the Optimization Lab.
          </p>
        </section>
      );
    }
    throw error;
  } finally {
    await database.close();
  }

  const netSaving =
    view.economics.netSavingNumerator === null ||
    view.economics.netSavingDenominator === null
      ? 'Unavailable'
      : `${view.economics.currency} ${view.economics.netSavingNumerator}/${view.economics.netSavingDenominator}`;

  return (
    <div className="lab-stack">
      {view.demoDisclaimer !== null ? (
        <div className="demo-banner" role="note">
          {view.demoDisclaimer}
        </div>
      ) : null}

      <header className="lab-header">
        <div>
          <p className="eyebrow">{LAB_COPY.heading}</p>
          <h1>Current versus candidate</h1>
          <p className="lede">
            Compare the same workload evidence before deciding whether a cheaper
            configuration is safe enough to adopt.
          </p>
        </div>
        <div
          className={`lab-decision decision-${view.decision.toLowerCase().replaceAll('_', '-')}`}
        >
          <span>Decision</span>
          <strong>{view.decision}</strong>
        </div>
      </header>

      <section
        className="comparison-grid"
        aria-label="Configuration comparison"
      >
        <article className="configuration-card">
          <p className="eyebrow">{LAB_COPY.currentLabel}</p>
          <h2>{view.current.configurationId}</h2>
          <dl>
            <div>
              <dt>Cost</dt>
              <dd>{metric(view.current.cost)}</dd>
            </div>
            <div>
              <dt>Quality</dt>
              <dd>{metric(view.current.quality)}</dd>
            </div>
            <div>
              <dt>p95 latency</dt>
              <dd>{metric(view.current.p95LatencyMs)}</dd>
            </div>
            <div>
              <dt>Failure rate</dt>
              <dd>{metric(view.current.failureRate)}</dd>
            </div>
          </dl>
        </article>
        <article className="configuration-card">
          <p className="eyebrow">{LAB_COPY.candidateLabel}</p>
          <h2>{view.candidate.configurationId}</h2>
          <dl>
            <div>
              <dt>Cost</dt>
              <dd>{metric(view.candidate.cost)}</dd>
            </div>
            <div>
              <dt>Quality</dt>
              <dd>{metric(view.candidate.quality)}</dd>
            </div>
            <div>
              <dt>p95 latency</dt>
              <dd>{metric(view.candidate.p95LatencyMs)}</dd>
            </div>
            <div>
              <dt>Failure rate</dt>
              <dd>{metric(view.candidate.failureRate)}</dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="lab-section" aria-labelledby="constraints-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{LAB_COPY.constraintLabel}</p>
            <h2 id="constraints-title">Performance gate</h2>
          </div>
        </div>
        <div className="table-scroll">
          <table className="constraint-table">
            <thead>
              <tr>
                <th scope="col">Metric</th>
                <th scope="col">Requirement</th>
                <th scope="col">Current</th>
                <th scope="col">Candidate</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {view.constraints.map((constraint) => (
                <ConstraintRow key={constraint.name} constraint={constraint} />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="lab-section" aria-labelledby="economics-title">
        <p className="eyebrow">{LAB_COPY.economicsLabel}</p>
        <h2 id="economics-title">Same-volume economics</h2>
        <div className="metrics-grid">
          <div className="metric-card">
            <p className="metric-label">Baseline cost</p>
            <p className="metric-value">
              {metric(view.economics.baselineCost)}
            </p>
          </div>
          <div className="metric-card">
            <p className="metric-label">Candidate cost</p>
            <p className="metric-value">
              {metric(view.economics.candidateCost)}
            </p>
          </div>
          <div className="metric-card">
            <p className="metric-label">Exact net saving</p>
            <p className="metric-value">{netSaving}</p>
          </div>
          <div className="metric-card">
            <p className="metric-label">Confidence</p>
            <p className="metric-value">{view.confidence.band}</p>
          </div>
        </div>
        <ul>
          {view.confidence.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </section>

      <section className="lab-section" aria-labelledby="evidence-title">
        <p className="eyebrow">{LAB_COPY.evidenceLabel}</p>
        <h2 id="evidence-title">Trace the claim</h2>
        <EvidenceDetails view={view} />
      </section>
    </div>
  );
}
