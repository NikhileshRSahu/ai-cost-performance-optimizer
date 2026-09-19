import { and, eq } from 'drizzle-orm';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  formatDecimal,
  rational,
} from '../../../../../../../src/economics/exact';
import { createDatabase } from '../../../../../../../src/persistence/database';
import {
  implementationRecords,
  recommendations,
  verificationWindows,
  workloads,
} from '../../../../../../../src/persistence/schema';
import { requireOrganizationAccess } from '../../../../../../../src/persistence/tenant';
import { WorkflowProgress } from '../../../../../components/workflow-progress';
import { resolveRuntimeSession } from '../../../../../lib/runtime-session';
import { submitVerification } from './action';

export const dynamic = 'force-dynamic';

function constraint(
  value: Record<string, unknown> | null,
  key: string,
): string | null {
  if (value === null) return null;
  const candidate = value[key];
  return typeof candidate === 'string' ? candidate : null;
}

function reasonList(evidence: Record<string, unknown>): readonly string[] {
  const reasons = evidence.reasons;
  return Array.isArray(reasons)
    ? reasons.filter((value): value is string => typeof value === 'string')
    : [];
}

export default async function VerifyPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ organizationId: string; recommendationId: string }>;
  searchParams: Promise<{ verificationId?: string }>;
}>) {
  const { organizationId, recommendationId } = await params;
  const { verificationId } = await searchParams;
  const session = await resolveRuntimeSession();
  const databaseUrl = process.env.DATABASE_URL;
  if (session === null || databaseUrl === undefined) redirect('/unauthorized');

  const database = createDatabase(databaseUrl);
  let recommendation: typeof recommendations.$inferSelect | undefined;
  let implementation: typeof implementationRecords.$inferSelect | undefined;
  let workload: typeof workloads.$inferSelect | undefined;
  let verification: typeof verificationWindows.$inferSelect | undefined;
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
    if (
      recommendation?.workloadId !== null &&
      recommendation?.workloadId !== undefined
    ) {
      workload = (
        await database.db
          .select()
          .from(workloads)
          .where(
            and(
              eq(workloads.organizationId, organizationId),
              eq(workloads.id, recommendation.workloadId),
            ),
          )
          .limit(1)
      ).at(0);
    }
    if (verificationId !== undefined) {
      verification = (
        await database.db
          .select()
          .from(verificationWindows)
          .where(
            and(
              eq(verificationWindows.organizationId, organizationId),
              eq(verificationWindows.id, verificationId),
            ),
          )
          .limit(1)
      ).at(0);
    }
  } finally {
    await database.close();
  }

  if (recommendation === undefined) redirect(`/o/${organizationId}`);
  if (implementation === undefined) {
    redirect(`/o/${organizationId}/implement/${recommendationId}`);
  }
  if (workload === undefined) {
    redirect(`/o/${organizationId}/workloads`);
  }

  const constraintSet = workload.constraintSet ?? null;
  const requiredQuality = constraint(constraintSet, 'requiredQuality');
  const maxP95LatencyMs = constraint(constraintSet, 'maxP95LatencyMs');
  const maxFailureRate = constraint(constraintSet, 'maxFailureRate');

  let impact: string | null = null;
  if (
    verification?.netImpactNumerator !== null &&
    verification?.netImpactNumerator !== undefined &&
    verification.netImpactDenominator !== null
  ) {
    impact = formatDecimal(
      rational(
        BigInt(verification.netImpactNumerator),
        BigInt(verification.netImpactDenominator),
      ),
      2,
    );
  }

  return (
    <div className="workflow-page">
      <WorkflowProgress organizationId={organizationId} current="verify" />
      <header className="workflow-header">
        <div>
          <p className="eyebrow">Step 5 · Verify</p>
          <h1>Measure what actually changed</h1>
          <p className="lede">
            Verification uses comparable request economics plus explicit
            post-change performance evidence. If comparability or safety fails,
            the recommendation stays TESTED.
          </p>
        </div>
        <span className="trust-chip">Verified only when every gate passes</span>
      </header>

      {verification !== undefined ? (
        <section
          className={`workflow-card verification-result verification-${verification.status.toLowerCase()}`}
        >
          <p className="eyebrow">Verification result</p>
          <h2>{verification.status}</h2>
          {impact !== null ? (
            <div className="verified-impact">
              <span>Verified net impact</span>
              <strong>
                {recommendation.currency ?? 'USD'} {impact}
              </strong>
              <small>Formula: {verification.formulaVersion}</small>
            </div>
          ) : null}
          {reasonList(verification.evidence).length > 0 ? (
            <ul>
              {reasonList(verification.evidence).map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          ) : null}
          <dl className="evidence-list">
            <div>
              <dt>Baseline</dt>
              <dd>
                {verification.baselineStart} → {verification.baselineEnd}
              </dd>
            </div>
            <div>
              <dt>Post-change</dt>
              <dd>
                {verification.postStart} → {verification.postEnd}
              </dd>
            </div>
          </dl>
          <div className="action-row">
            <Link
              className="primary-action"
              href={`/o/${organizationId}/report/${recommendationId}`}
            >
              Open evidence report
            </Link>
            <Link className="secondary-action" href={`/o/${organizationId}`}>
              Back to dashboard
            </Link>
          </div>
        </section>
      ) : (
        <section className="workflow-card">
          <form action={submitVerification} className="constraint-form">
            <input type="hidden" name="organizationId" value={organizationId} />
            <input
              type="hidden"
              name="recommendationId"
              value={recommendationId}
            />

            <label className="full-field file-drop">
              <span>Post-change usage CSV</span>
              <small>
                Use at least seven complete post-stabilization calendar days.
              </small>
              <input
                name="postCsv"
                type="file"
                accept=".csv,text/csv"
                required
              />
            </label>

            <label>
              <span>Measured post-change quality</span>
              <input
                name="measuredQuality"
                required
                inputMode="decimal"
                placeholder={requiredQuality ?? '0.92'}
              />
              <small>
                Required minimum: {requiredQuality ?? 'Unavailable'}
              </small>
            </label>
            <label>
              <span>Post-change p95 latency (ms)</span>
              <input
                name="postP95LatencyMs"
                inputMode="decimal"
                required={maxP95LatencyMs !== null}
                placeholder={maxP95LatencyMs ?? 'Not configured'}
              />
              <small>Maximum: {maxP95LatencyMs ?? 'Not configured'}</small>
            </label>
            <label>
              <span>Post-change failure rate</span>
              <input
                name="postFailureRate"
                inputMode="decimal"
                required={maxFailureRate !== null}
                placeholder={maxFailureRate ?? 'Not configured'}
              />
              <small>Maximum: {maxFailureRate ?? 'Not configured'}</small>
            </label>
            <label>
              <span>Quality evidence reference</span>
              <input
                name="qualitySourceRef"
                required
                placeholder="Example: eval-suite:classification-v3"
              />
              <small>
                Use the test run, report, or evaluation ID that supports the
                quality measurement.
              </small>
            </label>

            <details className="advanced-controls full-field">
              <summary>Optional cost adjustments</summary>
              <div className="advanced-controls-grid">
                <label>
                  <span>Implementation cost in this window</span>
                  <input
                    name="implementationCost"
                    defaultValue="0"
                    inputMode="decimal"
                  />
                </label>
                <label>
                  <span>Incremental operating cost</span>
                  <input
                    name="incrementalOperatingCost"
                    defaultValue="0"
                    inputMode="decimal"
                  />
                </label>
              </div>
            </details>

            <fieldset className="attestation-group full-field">
              <legend>Before we count this as verified</legend>
              <label className="checkbox-row">
                <input
                  name="unitDefinitionUnchanged"
                  type="checkbox"
                  value="true"
                  required
                />
                <span>Request/unit definition is unchanged.</span>
              </label>
              <label className="checkbox-row">
                <input
                  name="workloadMixComparable"
                  type="checkbox"
                  value="true"
                  required
                />
                <span>Workload mix is comparable to the baseline.</span>
              </label>
              <label className="checkbox-row">
                <input
                  name="concurrentDeploymentsResolved"
                  type="checkbox"
                  value="true"
                  required
                />
                <span>Concurrent deployments are absent or accounted for.</span>
              </label>
            </fieldset>

            <button className="primary-button" type="submit">
              Run verification
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
