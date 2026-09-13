import { and, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { createDatabase } from '../../../../../../../src/persistence/database';
import {
  implementationRecords,
  recommendations,
} from '../../../../../../../src/persistence/schema';
import { requireOrganizationAccess } from '../../../../../../../src/persistence/tenant';
import { WorkflowProgress } from '../../../../../components/workflow-progress';
import { resolveRuntimeSession } from '../../../../../lib/runtime-session';
import { markImplemented } from './action';

export const dynamic = 'force-dynamic';

function evidenceString(
  evidence: Record<string, unknown>,
  key: string,
): string | null {
  const value = evidence[key];
  return typeof value === 'string' ? value : null;
}

function evidenceList(
  evidence: Record<string, unknown>,
  key: string,
): readonly string[] {
  const value = evidence[key];
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : [];
}

export default async function ImplementPage({
  params,
}: Readonly<{
  params: Promise<{ organizationId: string; recommendationId: string }>;
}>) {
  const { organizationId, recommendationId } = await params;
  const session = await resolveRuntimeSession();
  const databaseUrl = process.env.DATABASE_URL;
  if (session === null || databaseUrl === undefined) redirect('/unauthorized');

  const database = createDatabase(databaseUrl);
  let recommendation: typeof recommendations.$inferSelect | undefined;
  let implementation: typeof implementationRecords.$inferSelect | undefined;
  try {
    requireOrganizationAccess({ session, organizationId, action: 'READ' });
    recommendation = (
      await database.db
        .select()
        .from(recommendations)
        .where(
          and(
            eq(recommendations.organizationId, organizationId),
            eq(recommendations.id, recommendationId),
          ),
        )
        .limit(1)
    ).at(0);
    implementation = (
      await database.db
        .select()
        .from(implementationRecords)
        .where(
          and(
            eq(implementationRecords.organizationId, organizationId),
            eq(implementationRecords.recommendationId, recommendationId),
          ),
        )
        .limit(1)
    ).at(0);
  } finally {
    await database.close();
  }

  if (recommendation === undefined) redirect(`/o/${organizationId}`);

  const proposedChange =
    evidenceString(recommendation.evidence, 'proposedChange') ??
    'Apply the benchmarked candidate through a controlled canary.';
  const rollback =
    evidenceList(recommendation.evidence, 'rollbackInstructions').join('\n') ||
    'Restore the current production configuration.';

  return (
    <div className="workflow-page">
      <WorkflowProgress organizationId={organizationId} current="implement" />
      <header className="workflow-header">
        <div>
          <p className="eyebrow">Step 4 · Implement</p>
          <h1>Confirm the change you made</h1>
          <p className="lede">
            The optimizer never changes production for you. Record the rollout
            only after your team has applied the tested change.
          </p>
        </div>
        <span className="trust-chip">Customer-controlled rollout</span>
      </header>

      <section className="workflow-card">
        <p className="eyebrow">Tested recommendation</p>
        <h2>{proposedChange}</h2>
        <p>
          State: <strong>{recommendation.savingState}</strong> · Decision:{' '}
          <strong>{recommendation.decision}</strong>
        </p>
      </section>

      {implementation !== undefined ? (
        <section className="workflow-card">
          <p className="eyebrow">Implementation evidence saved</p>
          <h2>{implementation.deploymentNote}</h2>
          <p>
            Stabilization ends at{' '}
            <strong>{implementation.stabilizationEnd}</strong>.
          </p>
          <a
            className="primary-action"
            href={`/o/${organizationId}/verify/${recommendationId}`}
          >
            Continue to verification
          </a>
        </section>
      ) : (
        <section className="workflow-card">
          <form action={markImplemented} className="constraint-form">
            <input type="hidden" name="organizationId" value={organizationId} />
            <input
              type="hidden"
              name="recommendationId"
              value={recommendationId}
            />
            <label>
              <span>Implemented at (UTC)</span>
              <input name="implementedAt" type="datetime-local" required />
            </label>
            <label>
              <span>Rollout started (UTC)</span>
              <input name="rolloutStart" type="datetime-local" required />
            </label>
            <label>
              <span>Stabilization ends (UTC)</span>
              <input name="stabilizationEnd" type="datetime-local" required />
            </label>
            <label className="full-field">
              <span>Deployment note</span>
              <textarea
                name="deploymentNote"
                required
                defaultValue={proposedChange}
                rows={4}
              />
            </label>
            <label className="full-field">
              <span>Rollback instructions</span>
              <textarea
                name="rollbackInstructions"
                required
                defaultValue={rollback}
                rows={4}
              />
            </label>
            <button className="primary-button" type="submit">
              Confirm implementation
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
