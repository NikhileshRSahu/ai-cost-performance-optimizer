import { asc, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { createDatabase } from '../../../../../src/persistence/database';
import { workloads } from '../../../../../src/persistence/schema';
import { requireOrganizationAccess } from '../../../../../src/persistence/tenant';
import { WorkflowProgress } from '../../../components/workflow-progress';
import { resolveRuntimeSession } from '../../../lib/runtime-session';
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
  let existing: (typeof workloads.$inferSelect)[] = [];
  try {
    requireOrganizationAccess({ session, organizationId, action: 'READ' });
    existing = await database.db
      .select()
      .from(workloads)
      .where(eq(workloads.organizationId, organizationId))
      .orderBy(asc(workloads.name));
  } finally {
    await database.close();
  }

  return (
    <div className="workflow-page">
      <WorkflowProgress organizationId={organizationId} current="workloads" />

      <header className="workflow-header">
        <div>
          <p className="eyebrow">Step 2 · Safety requirement</p>
          <h1>Define what “good enough” means</h1>
          <p className="lede">
            Cost cannot win by itself. Set the minimum quality your workload
            must preserve and any latency or failure-rate limits that matter.
          </p>
        </div>
        <span className="trust-chip">Quality threshold required</span>
      </header>

      <section className="workflow-card">
        <form action={saveWorkload} className="constraint-form">
          <input type="hidden" name="organizationId" value={organizationId} />
          <label>
            <span>Workload name</span>
            <input name="name" required placeholder="classification" />
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
              inputMode="decimal"
              placeholder="0.92"
            />
            <small>Use a 0–1 score from your chosen evaluation method.</small>
          </label>
          <label>
            <span>Maximum p95 latency (ms)</span>
            <input name="maxP95LatencyMs" inputMode="decimal" placeholder="1000" />
          </label>
          <label>
            <span>Maximum failure rate</span>
            <input name="maxFailureRate" inputMode="decimal" placeholder="0.02" />
          </label>
          <button className="primary-button" type="submit">
            Save constraints and continue
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
