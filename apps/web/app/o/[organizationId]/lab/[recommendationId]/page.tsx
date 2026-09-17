import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createDatabase } from '../../../../../../../src/persistence/database';
import { buildOptimizationLabView } from '../../../../../../../src/workbench/lab-view';
import {
  formatDecimal,
  rational,
} from '../../../../../../../src/economics/exact';
import { ConstraintRow } from '../../../../../components/constraint-row';
import { HistoricalReplay } from './historical-replay';
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
      error.message === 'LAB_EVIDENCE_INCOMPLETE'
    ) {
      return (
        <div className="lab-stack">
          <section
            className="empty-state"
            aria-labelledby="lab-validation-title"
          >
            <p className="eyebrow">Validation</p>
            <h1 id="lab-validation-title">Validate this opportunity</h1>
            <p>
              Evalomics found a usage-backed optimization opportunity, but it
              does not yet have enough current-versus-candidate evidence to
              claim a saving or recommend a production change.
            </p>

            <div className="comparison-grid">
              <article className="configuration-card">
                <p className="eyebrow">What we already know</p>
                <h2>There is a supported optimization hypothesis</h2>
                <p>
                  The opportunity came from measured usage evidence. It remains
                  Potential until a candidate is tested against the same cases
                  and safety requirements.
                </p>
              </article>
              <article className="configuration-card">
                <p className="eyebrow">What is still needed</p>
                <h2>Comparable validation evidence</h2>
                <p>
                  Provide paired current-versus-candidate test cases and the
                  quality or performance floor that must not get worse. Evalomics
                  will then compare cost and safety before upgrading the claim.
                </p>
              </article>
            </div>

            <div className="action-row">
              <Link
                className="primary-action"
                href={`/o/${organizationId}/benchmark`}
              >
                Add validation evidence
              </Link>
              <Link className="secondary-action" href={`/o/${organizationId}`}>
                Back to overview
              </Link>
            </div>
            <p className="metric-subtle">
              Advanced paired-case benchmarking remains available here; it is
              validation evidence, not a required step before Evalomics can show
              your initial analysis.
            </p>
          </section>
        </div>
      );
    }

    if (
      error instanceof Error &&
      error.message === 'RECOMMENDATION_NOT_FOUND'
    ) {
      return (
        <div className="lab-stack">
          <section
            className="empty-state"
            aria-labelledby="lab-unavailable-title"
          >
            <p className="eyebrow">{LAB_COPY.heading}</p>
            <h1 id="lab-unavailable-title">Insufficient benchmark evidence</h1>
            <p>
              This recommendation could not be found. Return to your analysis or
              benchmark workspace to choose an available recommendation.
            </p>
            <div className="action-row">
              <Link
                className="primary-action"
                href={`/o/${organizationId}/benchmark`}
              >
                Return to benchmark
              </Link>
              <Link className="secondary-action" href={`/o/${organizationId}`}>
                Back to overview
              </Link>
            </div>
          </section>
        </div>
      );
    }
    throw error;
  } finally {
    await database.close();
  }

  const netSavingNumerator = view.economics.netSavingNumerator;
  const netSavingDenominator = view.economics.netSavingDenominator;
  let netSaving = 'Unavailable';
  let exactNetSaving: string | null = null;
  if (netSavingNumerator !== null && netSavingDenominator !== null) {
    netSaving = `${view.economics.currency} ${formatDecimal(
      rational(BigInt(netSavingNumerator), BigInt(netSavingDenominator)),
      2,
    )}`;
    exactNetSaving = `${netSavingNumerator}/${netSavingDenominator}`;
  }

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
            {exactNetSaving !== null ? (
              <p className="metric-subtle">
                Exact calculation: {exactNetSaving}
              </p>
            ) : null}
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

      <HistoricalReplay
        organizationId={organizationId}
        recommendationId={recommendationId}
      />

      <section className="lab-section" aria-labelledby="evidence-title">
        <p className="eyebrow">{LAB_COPY.evidenceLabel}</p>
        <h2 id="evidence-title">Trace the claim</h2>
        <section className="lab-next-action">
          <div>
            <p className="eyebrow">What next?</p>
            <h2>
              {view.decision === 'OPTIMIZE'
                ? 'This candidate passed your safety test.'
                : 'Review the evidence before changing production.'}
            </h2>
            <p>
              Tested savings are not counted as Verified. Apply the change only
              when you are ready to collect comparable post-change evidence.
            </p>
          </div>
          <div className="action-row">
            {view.decision === 'OPTIMIZE' ? (
              <Link
                className="primary-action"
                href={`/o/${organizationId}/implement/${recommendationId}`}
              >
                Prepare safe rollout
              </Link>
            ) : null}
            <Link
              className="secondary-action"
              href={`/o/${organizationId}/proof`}
            >
              View savings status
            </Link>
          </div>
        </section>

        <EvidenceDetails view={view} />
      </section>
    </div>
  );
}
