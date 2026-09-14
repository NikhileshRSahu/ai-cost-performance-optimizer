import { and, eq } from 'drizzle-orm';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createDatabase } from '../../../../../../src/persistence/database';
import { importRuns } from '../../../../../../src/persistence/schema';
import { requireOrganizationAccess } from '../../../../../../src/persistence/tenant';
import { WorkflowProgress } from '../../../../components/workflow-progress';
import { resolveRuntimeSession } from '../../../../lib/runtime-session';
import { uploadUsageCsv } from './action';

export const dynamic = 'force-dynamic';

export default async function ImportPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{ importId?: string; demo?: string }>;
}>) {
  const { organizationId } = await params;
  const { importId, demo } = await searchParams;
  const session = await resolveRuntimeSession();
  const databaseUrl = process.env.DATABASE_URL;
  if (session === null || databaseUrl === undefined) redirect('/unauthorized');

  const database = createDatabase(databaseUrl);
  let imported: typeof importRuns.$inferSelect | null = null;
  try {
    requireOrganizationAccess({ session, organizationId, action: 'READ' });
    if (importId !== undefined) {
      imported =
        (
          await database.db
            .select()
            .from(importRuns)
            .where(
              and(
                eq(importRuns.organizationId, organizationId),
                eq(importRuns.id, importId),
              ),
            )
            .limit(1)
        ).at(0) ?? null;
    }
  } finally {
    await database.close();
  }

  return (
    <div className="workflow-page">
      <WorkflowProgress organizationId={organizationId} current="import" />

      <header className="workflow-header">
        <div>
          <p className="eyebrow">Step 1 · Observe</p>
          <h1>Import production usage</h1>
          <p className="lede">
            Start with the minimum evidence you are comfortable sharing. A usage
            CSV is enough for cost analysis; richer data can unlock deeper
            workflow advice later. We preserve provenance and never turn missing
            values into zero.
          </p>
        </div>
        <span className="trust-chip">
          Progressive privacy · CSV-first · no provider key required
        </span>
      </header>

      <section className="workflow-card" aria-labelledby="analysis-depth-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Choose your trust level</p>
            <h2 id="analysis-depth-title">
              More access unlocks more analysis — never more than you authorize
            </h2>
          </div>
        </div>
        <div className="summary-grid">
          <div>
            <span>Level 1 · Usage CSV</span>
            <strong>Cost + model efficiency</strong>
          </div>
          <div>
            <span>Level 2 · Sanitized AI export</span>
            <strong>Prompt + repeated context</strong>
          </div>
          <div>
            <span>Level 3 · Authorized workspace</span>
            <strong>Workflow + knowledge waste</strong>
          </div>
          <div>
            <span>Level 4 · Production telemetry</span>
            <strong>Continuous verification</strong>
          </div>
        </div>
        <p className="lede">
          Start at Level 1. The product must prove value before asking you to
          connect anything deeper.
        </p>
      </section>

      <section className="workflow-card upload-card">
        <div>
          <p className="eyebrow">Usage and cost CSV</p>
          <h2>Drop in the period you want to analyze</h2>
          <p>
            Required: timestamps, provider, model, requests, total cost and
            currency. Maximum 10 MiB and 50,000 data rows.
          </p>
          <Link className="text-link" href="/usage-template.csv">
            Download CSV template
          </Link>
        </div>
        <form action={uploadUsageCsv} className="upload-form">
          <input type="hidden" name="organizationId" value={organizationId} />
          <label className="file-drop">
            <span>Choose usage CSV</span>
            <small>Exact decimals preserved · invalid rows are rejected</small>
            <input
              name="usageCsv"
              type="file"
              accept=".csv,text/csv"
              required
            />
          </label>
          <label className="checkbox-row">
            <input
              name="isDemo"
              type="checkbox"
              value="true"
              defaultChecked={demo === 'true'}
            />
            <span>This file is synthetic demo data</span>
          </label>
          <button className="primary-button" type="submit">
            Validate and import
          </button>
        </form>
      </section>

      {imported !== null ? (
        <section
          className="workflow-card import-result"
          aria-labelledby="import-result-title"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">Import evidence</p>
              <h2 id="import-result-title">{imported.status}</h2>
            </div>
            {imported.isDemo ? (
              <span className="demo-inline">
                Synthetic demo data — not a customer result.
              </span>
            ) : null}
          </div>

          <div className="summary-grid" aria-label="Import evidence summary">
            <div>
              <span>Accepted</span>
              <strong>{imported.acceptedRows}</strong>
            </div>
            <div>
              <span>Duplicates skipped</span>
              <strong>{imported.skippedRows}</strong>
            </div>
            <div>
              <span>Rejected</span>
              <strong>{imported.rejectedRows}</strong>
            </div>
            <div>
              <span>Warnings</span>
              <strong>{imported.warningCount}</strong>
            </div>
          </div>

          <dl className="evidence-list">
            <div>
              <dt>Evidence window</dt>
              <dd>
                {imported.rangeStart ?? 'Unavailable'} →{' '}
                {imported.rangeEnd ?? 'Unavailable'}
              </dd>
            </div>
            <div>
              <dt>Checksum</dt>
              <dd>
                <code>{imported.checksum}</code>
              </dd>
            </div>
            <div>
              <dt>Source</dt>
              <dd>{imported.source}</dd>
            </div>
          </dl>

          {imported.status === 'FAILED' ? (
            <div className="recovery-stack">
              <div className="blocking-note">
                Analysis is blocked because no valid usage rows were accepted.
              </div>
              <div className="action-row">
                <Link
                  className="primary-action"
                  href={'/o/' + organizationId + '/import'}
                >
                  Try another CSV
                </Link>
                <Link
                  className="secondary-action"
                  href={'/o/' + organizationId}
                >
                  Return to overview
                </Link>
              </div>
            </div>
          ) : (
            <div className="action-row">
              <Link
                className="primary-action"
                href={`/o/${organizationId}/workloads`}
              >
                Define workload constraints
              </Link>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
