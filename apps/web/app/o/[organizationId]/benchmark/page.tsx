import { and, asc, desc, eq } from 'drizzle-orm';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createDatabase } from '../../../../../../src/persistence/database';
import {
  recommendations,
  workloads,
} from '../../../../../../src/persistence/schema';
import { requireOrganizationAccess } from '../../../../../../src/persistence/tenant';
import { WorkflowProgress } from '../../../../components/workflow-progress';
import { resolveRuntimeSession } from '../../../../lib/runtime-session';
import { submitBenchmark } from './action';

export const dynamic = 'force-dynamic';

export default async function BenchmarkPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{ workloadId?: string; error?: string }>;
}>) {
  const { organizationId } = await params;
  const { workloadId: selectedId, error } = await searchParams;
  const session = await resolveRuntimeSession();
  const databaseUrl = process.env.DATABASE_URL;
  if (session === null || databaseUrl === undefined) redirect('/unauthorized');

  const database = createDatabase(databaseUrl);
  const { available, latestRecommendation, sourceRecommendation } =
    await (async () => {
    try {
      requireOrganizationAccess({ session, organizationId, action: 'READ' });
      const availableWorkloads = await database.db
        .select()
        .from(workloads)
        .where(eq(workloads.organizationId, organizationId))
        .orderBy(asc(workloads.name));
      const latest =
        (
          await database.db
            .select()
            .from(recommendations)
            .where(eq(recommendations.organizationId, organizationId))
            .orderBy(desc(recommendations.createdAt))
            .limit(1)
        ).at(0) ?? null;
      const source =
        sourceRecommendationId === undefined
          ? null
          : (
              await database.db
                .select()
                .from(recommendations)
                .where(
                  and(
                    eq(recommendations.organizationId, organizationId),
                    eq(recommendations.id, sourceRecommendationId),
                  ),
                )
                .limit(1)
            ).at(0) ?? null;
      return {
        available: availableWorkloads,
        latestRecommendation: latest,
        sourceRecommendation: source,
      };
    } finally {
      await database.close();
    }
  })();

  const preferredWorkloadId =
    selectedId ?? sourceRecommendation?.workloadId ?? undefined;
  const selected =
    available.find((workload) => workload.id === preferredWorkloadId) ??
    available.at(0);

  const sourceEvidence = sourceRecommendation?.evidence ?? {};
  const sourceTitle =
    typeof sourceEvidence.title === 'string' ? sourceEvidence.title : null;
  const knownCurrentConfiguration =
    typeof sourceEvidence.currentConfigurationId === 'string'
      ? sourceEvidence.currentConfigurationId
      : '';
  const knownCandidateConfiguration =
    typeof sourceEvidence.candidateConfigurationId === 'string'
      ? sourceEvidence.candidateConfigurationId
      : '';
  const benchmarkCurrency = sourceRecommendation?.currency ?? 'USD';

  return (
    <div className="workflow-page">
      <WorkflowProgress organizationId={organizationId} current="benchmark" />

      <header className="workflow-header">
        <div>
          <p className="eyebrow">Tests</p>
          <h1>Test whether a cheaper setup is safe</h1>
          <p className="lede">
            Use the same cases for the current and candidate setup. Evalomics
            checks cost and your safety floor before recommending a change.
          </p>
        </div>
        <span className="trust-chip">Paired test · evidence first</span>
      </header>

      {sourceRecommendation !== null ? (
        <section className="latest-test-card">
          <div>
            <p className="eyebrow">Testing this finding</p>
            <h2>{sourceTitle ?? 'Evidence-backed optimization finding'}</h2>
            <p>
              Evalomics will keep this test linked to the evidence window that
              produced the finding.
            </p>
          </div>
        </section>
      ) : null}

      {error !== undefined ? (
        <div className="blocking-note import-error-note" role="alert">
          {error}
        </div>
      ) : null}

      {latestRecommendation !== null ? (
        <section className="latest-test-card">
          <div>
            <p className="eyebrow">Latest test</p>
            <h2>
              {latestRecommendation.savingState === 'TESTED'
                ? '✓ Candidate passed the test'
                : 'Previous test result available'}
            </h2>
            <p>
              Decision: <strong>{latestRecommendation.decision}</strong> ·
              Confidence: {latestRecommendation.confidenceBand ?? 'Unavailable'}
            </p>
          </div>
          <Link
            className="primary-action"
            href={`/o/${organizationId}/lab/${latestRecommendation.id}`}
          >
            Open latest result
          </Link>
        </section>
      ) : null}

      {selected === undefined ? (
        <section className="workflow-card empty-state">
          <h2>No workload constraints yet</h2>
          <p>Define the production requirement before running a benchmark.</p>
          <Link
            className="primary-action"
            href={`/o/${organizationId}/workloads${
              sourceRecommendationId === undefined
                ? ''
                : `?recommendationId=${encodeURIComponent(sourceRecommendationId)}`
            }`}
          >
            Define constraints
          </Link>
        </section>
      ) : (
        <section className="workflow-card">
          <div className="benchmark-context">
            <div>
              <p className="eyebrow">Ready to test</p>
              <h2>{selected.name}</h2>
              <p>
                Upload paired test cases. The advanced identifiers below are
                prefilled and can be changed only when your file uses different
                values.
              </p>
            </div>
          </div>

          <form
            action={submitBenchmark}
            className="benchmark-form simplified-benchmark-form"
          >
            <input type="hidden" name="organizationId" value={organizationId} />
            <input
              type="hidden"
              name="sourceRecommendationId"
              value={sourceRecommendationId ?? ''}
            />
            <label>
              <span>Workload</span>
              <select name="workloadId" defaultValue={selected.id}>
                {available.map((workload) => (
                  <option key={workload.id} value={workload.id}>
                    {workload.name} · {workload.environment}
                  </option>
                ))}
              </select>
            </label>
            <label className="file-drop benchmark-upload">
              <span>Upload paired test cases</span>
              <small>
                30 paired cases minimum · same cases for both setups
              </small>
              <input
                name="benchmarkCsv"
                type="file"
                accept=".csv,text/csv"
                required
              />
            </label>

            <details className="advanced-controls benchmark-advanced">
              <summary>Advanced benchmark settings</summary>
              <div className="advanced-controls-grid">
                <label>
                  <span>Current configuration</span>
                  <input
                    name="currentConfigurationId"
                    required
                    defaultValue={knownCurrentConfiguration}
                    placeholder="Current config from your evidence"
                  />
                </label>
                <label>
                  <span>Candidate configuration</span>
                  <input
                    name="candidateConfigurationId"
                    required
                    defaultValue={knownCandidateConfiguration}
                    placeholder="Candidate configuration to test"
                  />
                </label>
                <label>
                  <span>Evaluator version</span>
                  <input
                    name="evaluatorVersion"
                    required
                    defaultValue="eval-v1"
                  />
                </label>
                <label>
                  <span>Currency</span>
                  <input
                    name="currency"
                    required
                    defaultValue={benchmarkCurrency}
                    pattern="[A-Z]{3}"
                  />
                </label>
              </div>
            </details>
            <label className="checkbox-row">
              <input name="isDemo" type="checkbox" value="true" />
              <span>This benchmark is synthetic demo evidence</span>
            </label>
            <div className="action-row">
              <Link className="secondary-action" href="/benchmark-template.csv">
                Download test template
              </Link>
              <button className="primary-button" type="submit">
                Run safety test
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
