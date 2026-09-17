import { asc, desc, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { createDatabase } from '../../../../../../src/persistence/database';
import { usageRecords, workloads } from '../../../../../../src/persistence/schema';
import { requireOrganizationAccess } from '../../../../../../src/persistence/tenant';
import { WorkflowProgress } from '../../../../components/workflow-progress';
import { resolveRuntimeSession } from '../../../../lib/runtime-session';
import { saveWorkload } from './action';

export const dynamic = 'force-dynamic';

export default async function WorkloadsPage({
  params,
}: Readonly<{ params: Promise<{ organizationId: string }> }>) {
  const { organizationId } = await params;
  const session = await resolveRuntimeSession();
  const databaseUrl = process.env.DATABASE_URL;
  if (session === null || databaseUrl === undefined) redirect('/unauthorized');

  const database = createDatabase(databaseUrl);
  const { existing, inferredWorkload } = await (async () => {
    try {
      requireOrganizationAccess({ session, organizationId, action: 'READ' });
      const existingRows = await database.db
        .select()
        .from(workloads)
        .where(eq(workloads.organizationId, organizationId))
        .orderBy(asc(workloads.name));
      const latestUsage = (
        await database.db
          .select({ canonical: usageRecords.canonical })
          .from(usageRecords)
          .where(eq(usageRecords.organizationId, organizationId))
          .orderBy(desc(usageRecords.intervalEnd))
          .limit(1)
      ).at(0);
      const workloadFromUsage = latestUsage?.canonical?.workload;
      return {
        existing: existingRows,
        inferredWorkload:
          typeof workloadFromUsage === 'string' && workloadFromUsage.trim().length > 0
            ? workloadFromUsage
            : 'AI workload',
      };
    } finally {
      await database.close();
    }
  })();

  return (
    <div className="workflow-page">
      <WorkflowProgress organizationId={organizationId} current="workloads" />

      <header className="workflow-header">
        <div>
          <p className="eyebrow">Safety</p>
          <h1>Tell us what must not get worse</h1>
          <p className="lede">
            Evalomics can optimize cost, but only inside the guardrails you
            choose. We prefill what we can from your evidence.
          </p>
        </div>
        <span className="trust-chip">One required choice</span>
      </header>

      <section className="workflow-card">
        <form action={saveWorkload} className="constraint-form">
          <input type="hidden" name="organizationId" value={organizationId} />
          <label>
            <span>Workload name</span>
            <input name="name" required defaultValue={inferredWorkload} />
          </label>
          <label>
            <span>Environment</span>
            <input name="environment" required defaultValue="production" />
          </label>
          <label>
            <span>Minimum quality</span>
            <input
              name="requiredQuality"
              required
              type="number"
              min="0"
              max="1"
              step="0.01"
              inputMode="decimal"
              defaultValue="0.90"
            />
            <small>Default: preserve at least 90% on your chosen evaluator.</small>
          </label>
          <details className="advanced-controls">
            <summary>Advanced safety controls</summary>
            <div className="advanced-controls-grid">
              <label>
                <span>Maximum p95 latency (ms)</span>
                <input
                  name="maxP95LatencyMs"
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  placeholder="Optional"
                />
              </label>
              <label>
                <span>Maximum failure rate</span>
                <input
                  name="maxFailureRate"
                  type="number"
                  min="0"
                  max="1"
                  step="any"
                  inputMode="decimal"
                  placeholder="Optional"
                />
              </label>
            </div>
          </details>
          <button className="primary-button" type="submit">
            Save safety floor and continue
          </button>
        </form>
      </section>

      {existing.length > 0 ? (
        <section className="workflow-card">
          <p className="eyebrow">Existing workload constraints</p>
          <div className="workload-list">
            {existing.map((workload) => (
              <article key={workload.id}>
                <div>
                  <strong>{workload.name}</strong>
                  <span>{workload.environment}</span>
                </div>
                <code>{workload.id}</code>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
