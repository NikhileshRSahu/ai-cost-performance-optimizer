import { and, eq } from 'drizzle-orm';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createDatabase } from '../../../../../../src/persistence/database';
import { listProviderConnections } from '../../../../../../src/persistence/repositories/provider-connections';
import { importRuns } from '../../../../../../src/persistence/schema';
import { requireOrganizationAccess } from '../../../../../../src/persistence/tenant';
import { resolveRuntimeSession } from '../../../../lib/runtime-session';
import {
  connectProviderAccount,
  disconnectProviderAccount,
  uploadUsageCsv,
} from './action';

export const dynamic = 'force-dynamic';

function providerErrorCopy(code: string | undefined): string | null {
  if (code === undefined) return null;
  if (code === 'PROVIDER_CREDENTIAL_REJECTED') {
    return 'The provider rejected this credential. Check that it is an organization admin key with access to usage and cost reports.';
  }
  if (code === 'PROVIDER_RATE_LIMITED') {
    return 'The provider rate-limited the validation request. Try again shortly.';
  }
  if (code === 'PROVIDER_CONNECTION_NOT_CONFIGURED') {
    return 'Evalomics provider credential encryption is not configured on this deployment yet.';
  }
  return 'Evalomics could not validate this provider connection. No credential was saved.';
}

export default async function ImportPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{
    importId?: string;
    demo?: string;
    error?: string;
    providerConnected?: string;
    providerDisconnected?: string;
    providerError?: string;
    usageRows?: string;
    costRows?: string;
  }>;
}>) {
  const { organizationId } = await params;
  const query = await searchParams;
  const { importId, demo, error } = query;
  const session = await resolveRuntimeSession();
  const databaseUrl = process.env.DATABASE_URL;
  if (session === null || databaseUrl === undefined) redirect('/unauthorized');

  const database = createDatabase(databaseUrl);
  let imported: typeof importRuns.$inferSelect | null = null;
  let connections = await Promise.resolve(
    [] as Awaited<ReturnType<typeof listProviderConnections>>,
  );
  try {
    requireOrganizationAccess({ session, organizationId, action: 'READ' });
    connections = await listProviderConnections({
      db: database.db,
      session,
      organizationId,
    });
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

  const canManageConnections = session.memberships.some(
    (membership) =>
      membership.organizationId === organizationId &&
      membership.role === 'OWNER',
  );
  const providerError = providerErrorCopy(query.providerError);

  return (
    <div className="workflow-page">
      <header className="workflow-header">
        <div>
          <p className="eyebrow">Data</p>
          <h1>Connect your AI usage</h1>
          <p className="lede">
            Connect OpenAI or Anthropic for the fastest path, or upload a CSV.
            Evalomics validates the source first and only shows findings the
            available evidence can support.
          </p>
        </div>
        <span className="trust-chip">Encrypted credentials · CSV fallback</span>
      </header>

      {providerError !== null ? (
        <div className="blocking-note import-error-note" role="alert">
          {providerError}
        </div>
      ) : null}
      {query.providerConnected !== undefined ? (
        <div className="workflow-card import-result" role="status">
          <p className="eyebrow">Connection ready</p>
          <h2>{query.providerConnected} validated successfully</h2>
          <p>
            Evalomics checked a bounded 7-day window and found{' '}
            {query.usageRows ?? '0'} usage evidence rows and{' '}
            {query.costRows ?? '0'} cost evidence rows. The credential is stored
            encrypted and is never displayed back to the browser.
          </p>
        </div>
      ) : null}
      {query.providerDisconnected !== undefined ? (
        <div className="workflow-card import-result" role="status">
          <p className="eyebrow">Disconnected</p>
          <h2>{query.providerDisconnected} credential removed</h2>
          <p>
            Previously imported evidence is left intact for your audit history.
          </p>
        </div>
      ) : null}
      {error !== undefined ? (
        <div className="blocking-note import-error-note" role="alert">
          {error}
        </div>
      ) : null}

      <section className="workflow-card">
        <div>
          <p className="eyebrow">Recommended</p>
          <h2>Connect a provider</h2>
          <p>
            Evalomics makes a read-only validation request to the provider usage
            and cost reporting APIs. It does not deploy changes, call models on
            your behalf, or expose the credential after submission.
          </p>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {(['OPENAI', 'ANTHROPIC'] as const).map((provider) => {
            const connection = connections.find(
              (candidate) =>
                candidate.provider === provider && candidate.revokedAt === null,
            );
            return (
              <div
                key={provider}
                className="rounded-2xl border border-white/10 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {provider === 'OPENAI' ? 'OpenAI' : 'Anthropic'}
                    </h3>
                    <p className="mt-1 text-sm text-white/60">
                      {connection === undefined
                        ? 'Not connected'
                        : connection.lastSyncStatus === 'READY'
                          ? 'Connected · validation succeeded'
                          : `Connected · ${connection.lastSyncStatus.toLowerCase()}`}
                    </p>
                  </div>
                  {connection?.lastSyncAt !== null &&
                  connection?.lastSyncAt !== undefined ? (
                    <span className="trust-chip">
                      Last checked{' '}
                      {new Date(connection.lastSyncAt).toLocaleDateString()}
                    </span>
                  ) : null}
                </div>

                {canManageConnections ? (
                  connection === undefined ? (
                    <form
                      action={connectProviderAccount}
                      className="mt-5 grid gap-3"
                    >
                      <input
                        type="hidden"
                        name="organizationId"
                        value={organizationId}
                      />
                      <input type="hidden" name="provider" value={provider} />
                      <label className="grid gap-2 text-sm">
                        <span>Organization admin key</span>
                        <input
                          className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-white outline-none"
                          name="adminKey"
                          type="password"
                          autoComplete="off"
                          spellCheck={false}
                          required
                          placeholder={
                            provider === 'OPENAI'
                              ? 'OpenAI admin key'
                              : 'Anthropic admin key'
                          }
                        />
                      </label>
                      <button className="primary-button" type="submit">
                        Connect {provider === 'OPENAI' ? 'OpenAI' : 'Anthropic'}
                      </button>
                    </form>
                  ) : (
                    <form action={disconnectProviderAccount} className="mt-5">
                      <input
                        type="hidden"
                        name="organizationId"
                        value={organizationId}
                      />
                      <input type="hidden" name="provider" value={provider} />
                      <button className="secondary-action" type="submit">
                        Disconnect
                      </button>
                    </form>
                  )
                ) : (
                  <p className="mt-5 text-sm text-white/50">
                    Workspace owner permission is required to manage provider
                    credentials.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="workflow-card upload-card">
        <div>
          <p className="eyebrow">CSV fallback</p>
          <h2>Upload a usage CSV</h2>
          <p>
            Prefer not to connect a provider? Upload an existing export or use
            the Evalomics template. Maximum 10 MiB and 50,000 rows.
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
            <small>
              We validate the file before adding it to your analysis
            </small>
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
                <Link
                  className="secondary-action"
                  href={`/o/${organizationId}`}
                >
                  Return to overview
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
              </details>
            </>
          )}
        </section>
      ) : null}
    </div>
  );
}
