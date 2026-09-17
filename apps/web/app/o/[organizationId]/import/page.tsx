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
  searchParams: Promise<{ importId?: string; demo?: string; error?: string }>;
}>) {
  const { organizationId } = await params;
  const { importId, demo, error } = await searchParams;
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
          <p className="eyebrow">Data</p>
          <h1>Give Evalomics your AI usage</h1>
          <p className="lede">
            Upload a provider export or Evalomics-formatted CSV. We validate it,
            analyze accepted usage, and show you what is worth investigating next.
          </p>
        </div>
        <span className="trust-chip">No provider key required</span>
      </header>

      {error !== undefined ? (
        <div className="blocking-note import-error-note" role="alert">
          {error}
        </div>
      ) : null}

      <section className="workflow-card upload-card">
        <div>
          <p className="eyebrow">Upload</p>
          <h2>Drop in one useful usage window</h2>
          <p>
            Start with an existing export. Evalomics checks the file before it
            affects your workspace. Maximum 10 MiB and 50,000 rows.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link className="text-link" href="/usage-template.csv">
              Download CSV template
            </Link>
            <Link className="text-link" href="/demo-usage.csv">
              Download synthetic demo CSV
            </Link>
          </div>
          <p className="mt-3 text-xs opacity-70">
            New here? Download the synthetic demo, upload it below, and check
            “This file is synthetic demo data” to see the workflow before using
            customer evidence.
          </p>
        </div>
        <form action={uploadUsageCsv} className="upload-form">
          <input type="hidden" name="organizationId" value={organizationId} />
          <label className="file-drop">
            <span>Choose AI usage CSV</span>
            <small>We validate the file first and clearly show what was accepted</small>
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
            Analyze this usage
          </button>
        </form>
      </section>

      {imported !== null ? (
        <section
          className="workflow-card import-result"
          aria-labelledby="import-result-title"
        >
          <div className="import-success-head">
            <div className="import-success-check" aria-hidden="true">✓</div>
            <div>
              <p className="eyebrow">Data ready</p>
              <h2 id="import-result-title">
                {imported.status === 'FAILED'
                  ? 'We could not use this file'
                  : `✓ ${imported.acceptedRows.toLocaleString()} usage rows analyzed`}
              </h2>
              {imported.status !== 'FAILED' ? (
                <p className="import-success-copy">
                  Your evidence is in the workspace. You can continue without
                  reading any technical import details.
                </p>
              ) : null}
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

          <details className="import-details">
            <summary>View import details</summary>
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
                <dd><code>{imported.checksum}</code></dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>{imported.source}</dd>
              </div>
            </dl>
          </details>

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
                Continue to safety setup
              </Link>
              <Link
                className="secondary-action"
                href={`/o/${organizationId}`}
              >
                View analysis overview
              </Link>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
