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

const VALIDATION_COPY = {
  intro:
    'You already have an actionable usage-backed finding. Evalomics uses comparable evidence here to evaluate the candidate against your quality and performance requirements and measure the exact saving.',
  known:
    'Evalomics found this opportunity from measured usage evidence. You can use the recommendation now as an optimization lead without claiming an exact financial saving.',
  needed:
    'If comparable current-versus-candidate evidence is not available yet, connect or provide it once. Evalomics handles the comparison, applies the quality/performance floor, and decides whether the candidate is safe enough to recommend.',
  note: 'This evaluation step is optional for the initial analysis. When sufficient comparable evidence exists, Evalomics performs the candidate evaluation and upgrades the finding only when the evidence supports it.',
} as const;

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
    if (error instanceof Error && error.message === 'LAB_EVIDENCE_INCOMPLETE') {
      return (
        <div className="lab-stack">
          <section
            className="empty-state"
            aria-labelledby="lab-validation-title"
          >
            <p className="eyebrow">Optional proof</p>
            <h1 id="lab-validation-title">
              Let Evalomics evaluate this candidate
            </h1>
            <p>{VALIDATION_COPY.intro}</p>

            <div className="comparison-grid">
              <article className="configuration-card">
                <p className="eyebrow">Your result already exists</p>
                <h2>There is a supported optimization finding</h2>
                <p>{VALIDATION_COPY.known}</p>
              </article>
              <article className="configuration-card">
                <p className="eyebrow">Only if you want stronger proof</p>
                <h2>Comparable evaluation evidence</h2>
                <p>{VALIDATION_COPY.needed}</p>
              </article>
            </div>

            <div className="action-row">
              <Link
                className="primary-action"
                href={`/o/${organizationId}/benchmark?recommendationId=${encodeURIComponent(recommendationId)}`}
              >
                Add evidence for Evalomics evaluation
              </Link>
              <Link className="secondary-action" href={`/o/${organizationId}`}>
                Keep current result
              </Link>
            </div>
            <p className="metric-subtle">{VALIDATION_COPY.note}</p>
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
                className="primary-action recovery-primary-action"
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
            Evalomics compares the same workload evidence and checks whether the
            cheaper configuration stays inside your required quality and
            performance floor before recommending adoption.
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
                ? 'Evalomics found this candidate safe enough to recommend.'
                : 'Review the evidence before changing production.'}
            </h2>
            <p>
              Evaluated savings are still not Verified. Apply the change only
              when you are ready for Evalomics to compare post-change production
              evidence.
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
