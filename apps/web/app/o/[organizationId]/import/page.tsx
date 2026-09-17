import { and, eq } from 'drizzle-orm';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createDatabase } from '../../../../../../src/persistence/database';
import { importRuns } from '../../../../../../src/persistence/schema';
import { requireOrganizationAccess } from '../../../../../../src/persistence/tenant';
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
      <header className="workflow-header">
        <div>
          <p className="eyebrow">Data</p>
          <h1>Give Evalomics your AI usage</h1>
          <p className="lede">
            Upload one useful usage window. Evalomics validates it, analyzes the
            accepted evidence, and takes you straight to the strongest answer it
            can support.
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
          <h2>Choose your usage CSV</h2>
          <p>
            Start with an existing export or the Evalomics template. Maximum 10
            MiB and 50,000 rows.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link className="text-link" href="/usage-template.csv">
              Download CSV template
            </Link>
            <Link className="text-link" href="/demo-usage.csv">
              Try synthetic demo data
            </Link>
          </div>
        </div>
        <form action={uploadUsageCsv} className="upload-form">
          <input type="hidden" name="organizationId" value={organizationId} />
          <label className="file-drop">
            <span>Choose AI usage CSV</span>
            <small>We validate the file before adding it to your analysis</small>
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
            <div className="import-success-check" aria-hidden="true">
              ✓
            </div>
            <div>
              <p className="eyebrow">Analysis ready</p>
              <h2 id="import-result-title">
                {imported.status === 'FAILED'
                  ? 'We could not use this file'
                  : 'Your AI usage data is ready'}
              </h2>
              {imported.status !== 'FAILED' ? (
                <p className="import-success-copy">
                  {imported.acceptedRows.toLocaleString()} usage rows were
                  accepted. You can see the result now; technical import details
                  are optional.
                </p>
              ) : null}
            </div>
            {imported.isDemo ? (
              <span className="demo-inline">
                Synthetic demo data — not a customer result.
              </span>
            ) : null}
          </div>

          {imported.status === 'FAILED' ? (
            <div className="recovery-stack">
              <div className="blocking-note">
                No valid usage rows were accepted. Fix the CSV and try again.
              </div>
              <div className="action-row">
                <Link
                  className="primary-action"
                  href={`/o/${organizationId}/import`}
                >
                  Try another CSV
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="action-row">
                <Link className="primary-action" href={`/o/${organizationId}`}>
                  View my analysis
                </Link>
              </div>

              <details className="import-details">
                <summary>See import details</summary>
                <div
                  className="summary-grid"
                  aria-label="Import evidence summary"
                >
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
                <Link
                  className="text-link"
                  href={`/o/${organizationId}/workloads`}
                >
                  Advanced: configure safety rules
                </Link>
              </details>
            </>
          )}
        </section>
      ) : null}
    </div>
  );
}
