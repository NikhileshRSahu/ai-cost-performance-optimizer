import { asc, eq } from 'drizzle-orm';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createDatabase } from '../../../../../src/persistence/database';
import { workloads } from '../../../../../src/persistence/schema';
import { requireOrganizationAccess } from '../../../../../src/persistence/tenant';
import { WorkflowProgress } from '../../../components/workflow-progress';
import { resolveRuntimeSession } from '../../../lib/runtime-session';
import { submitBenchmark } from './action';

export const dynamic = 'force-dynamic';

export default async function BenchmarkPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{ workloadId?: string }>;
}>) {
  const { organizationId } = await params;
  const { workloadId: selectedId } = await searchParams;
  const session = await resolveRuntimeSession();
  const databaseUrl = process.env.DATABASE_URL;
  if (session === null || databaseUrl === undefined) redirect('/unauthorized');

  const database = createDatabase(databaseUrl);
  let available: (typeof workloads.$inferSelect)[] = [];
  try {
    requireOrganizationAccess({ session, organizationId, action: 'READ' });
    available = await database.db
      .select()
      .from(workloads)
      .where(eq(workloads.organizationId, organizationId))
      .orderBy(asc(workloads.name));
  } finally {
    await database.close();
  }

  const selected =
    available.find((workload) => workload.id === selectedId) ?? available.at(0);

  return (
    <div className="workflow-page">
      <WorkflowProgress organizationId={organizationId} current="benchmark" />

      <header className="workflow-header">
        <div>
          <p className="eyebrow">Step 3 · Benchmark</p>
          <h1>Test the cheaper candidate</h1>
          <p className="lede">
            Upload paired current-versus-candidate measurements. A cheaper
            candidate only advances when every configured safety constraint is
            measured and passes.
          </p>
        </div>
        <span className="trust-chip">Same workload · same cases</span>
      </header>

      {selected === undefined ? (
        <section className="workflow-card empty-state">
          <h2>No workload constraints yet</h2>
          <p>Define the production requirement before running a benchmark.</p>
          <Link className="primary-action" href={`/o/${organizationId}/workloads`}>
            Define constraints
          </Link>
        </section>
      ) : (
        <section className="workflow-card">
          <div className="benchmark-context">
            <div>
              <p className="eyebrow">Selected workload</p>
              <h2>{selected.name}</h2>
              <p>{selected.environment}</p>
            </div>
            <code>{selected.id}</code>
          </div>

          <form action={submitBenchmark} className="benchmark-form">
            <input type="hidden" name="organizationId" value={organizationId} />
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
            <label>
              <span>Current configuration</span>
              <input name="currentConfigurationId" required defaultValue="model-a" />
            </label>
            <label>
              <span>Candidate configuration</span>
              <input name="candidateConfigurationId" required defaultValue="model-b" />
            </label>
            <label>
              <span>Evaluator version</span>
              <input name="evaluatorVersion" required defaultValue="eval-v1" />
            </label>
            <label>
              <span>Currency</span>
              <input name="currency" required defaultValue="USD" pattern="[A-Z]{3}" />
            </label>
            <label className="file-drop benchmark-upload">
              <span>Choose benchmark CSV</span>
              <small>30 paired cases minimum · two repetitions recommended</small>
              <input
                name="benchmarkCsv"
                type="file"
                accept=".csv,text/csv"
                required
              />
            </label>
            <label className="checkbox-row">
              <input name="isDemo" type="checkbox" value="true" />
              <span>This benchmark is synthetic demo evidence</span>
            </label>
            <div className="action-row">
              <Link className="secondary-action" href="/benchmark-template.csv">
                Download benchmark template
              </Link>
              <button className="primary-button" type="submit">
                Evaluate candidate
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
