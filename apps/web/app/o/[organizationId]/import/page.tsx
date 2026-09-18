import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createDatabase } from '../../../../../../src/persistence/database';
import { listProviderConnections } from '../../../../../../src/persistence/repositories/provider-connections';
import { requireOrganizationAccess } from '../../../../../../src/persistence/tenant';
import { resolveRuntimeSession } from '../../../../lib/runtime-session';
import {
  analyzeDemoUsage,
  connectProviderAccount,
  disconnectProviderAccount,
  syncProviderAccount,
  uploadUsageCsv,
} from './action';

export const dynamic = 'force-dynamic';

function providerErrorCopy(code: string | undefined): string | null {
  if (code === undefined) return null;
  if (code === 'PROVIDER_CREDENTIAL_REJECTED') {
    return 'The provider rejected this Admin API key. Check that it can read organization usage and costs.';
  }
  if (code === 'PROVIDER_RATE_LIMITED') {
    return 'The provider rate-limited the connection check. Try again shortly.';
  }
  if (code === 'PROVIDER_CONNECTION_NOT_CONFIGURED') {
    return 'Provider connections are not fully configured on this Evalomics deployment yet.';
  }
  if (code === 'PROVIDER_TEMPORARY_ERROR') {
    return 'A temporary database connection interruption stopped the sync. No failed sync is treated as valid evidence. Try again.';
  }
  if (code === 'PROVIDER_CONNECTION_REQUIRED') {
    return 'This provider is not connected anymore. Connect it again to analyze usage.';
  }
  return 'Evalomics could not validate this provider connection. Nothing was saved.';
}

export default async function ImportPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{
    error?: string;
    providerError?: string;
    providerDisconnected?: string;
  }>;
}>) {
  const { organizationId } = await params;
  const query = await searchParams;
  const session = await resolveRuntimeSession();
  const databaseUrl = process.env.DATABASE_URL;
  if (session === null || databaseUrl === undefined) redirect('/unauthorized');

  const database = createDatabase(databaseUrl);
  let connections: Awaited<ReturnType<typeof listProviderConnections>> = [];
  try {
    requireOrganizationAccess({ session, organizationId, action: 'READ' });
    connections = await listProviderConnections({
      db: database.db,
      session,
      organizationId,
    });
  } finally {
    await database.close();
  }

  const owner = session.memberships.some(
    (membership) =>
      membership.organizationId === organizationId &&
      membership.role === 'OWNER',
  );
  const providerError = providerErrorCopy(query.providerError);

  return (
    <div className="grid gap-6">
      <header className="border-b border-white/[0.07] pb-6">
        <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.17em] text-blue-200/55">
          Data source
        </p>
        <h1 className="m-0 mt-2 !text-[clamp(2.5rem,5vw,4.5rem)] !leading-[.98] !tracking-[-.055em] text-white">
          Connect or upload your AI usage
        </h1>
        <p className="m-0 mt-4 max-w-3xl text-sm leading-6 text-white/55">
          Choose one source. Evalomics validates it, analyzes the evidence
          automatically, and sends you straight to the strongest answer it can
          support.
        </p>
      </header>

      {providerError !== null ? (
        <div
          className="rounded-xl border border-rose-300/20 bg-rose-300/[0.06] px-4 py-3 text-sm text-rose-100"
          role="alert"
        >
          {providerError}
        </div>
      ) : null}

      {query.error !== undefined ? (
        <div
          className="rounded-xl border border-rose-300/20 bg-rose-300/[0.06] px-4 py-3 text-sm text-rose-100"
          role="alert"
        >
          {query.error}
        </div>
      ) : null}

      {query.providerDisconnected !== undefined ? (
        <div
          className="rounded-xl border border-emerald-300/15 bg-emerald-300/[0.05] px-4 py-3 text-sm text-emerald-100/80"
          role="status"
        >
          {query.providerDisconnected} disconnected. Historical analysis
          evidence remains available.
        </div>
      ) : null}

      <section
        className="grid gap-4 lg:grid-cols-3"
        aria-label="AI usage source choices"
      >
        {(['OPENAI', 'ANTHROPIC'] as const).map((provider) => {
          const connection = connections.find(
            (candidate) =>
              candidate.provider === provider && candidate.revokedAt === null,
          );
          const label = provider === 'OPENAI' ? 'OpenAI' : 'Anthropic';

          return (
            <article
              key={provider}
              className="rounded-[22px] border border-white/[0.08] bg-[#0a0f16] p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-200/55">
                    Provider · Admin API beta
                  </p>
                  <h2 className="m-0 mt-2 text-xl font-semibold text-white">
                    {label}
                  </h2>
                </div>
                <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-semibold text-white/55">
                  {connection === undefined
                    ? 'Not connected'
                    : connection.lastSyncStatus === 'READY'
                      ? 'Connected'
                      : 'Needs check'}
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-white/48">
                Read organization API usage and cost reports. Prompts and
                responses are not requested. Consumer ChatGPT/Claude app usage
                is not included.
              </p>

              {connection === undefined ? (
                owner ? (
                  <details className="mt-5 rounded-xl border border-white/[0.08] bg-white/[0.02]">
                    <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-white">
                      Connect {label}
                    </summary>
                    <form
                      action={connectProviderAccount}
                      className="grid gap-3 border-t border-white/[0.07] p-4"
                    >
                      <input
                        type="hidden"
                        name="organizationId"
                        value={organizationId}
                      />
                      <input type="hidden" name="provider" value={provider} />
                      <label className="grid gap-2 text-xs font-medium text-white/60">
                        Organization Admin API key
                        <input
                          className="min-h-11 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-300/35"
                          name="adminKey"
                          type="password"
                          autoComplete="off"
                          spellCheck={false}
                          required
                          placeholder={
                            provider === 'OPENAI'
                              ? 'OpenAI Admin key'
                              : 'Anthropic Admin key'
                          }
                        />
                      </label>
                      <p className="m-0 text-[11px] leading-5 text-white/38">
                        Limited beta: the organization Admin API key is
                        validated server-side and stored only as encrypted
                        ciphertext. Disconnecting clears the stored ciphertext.
                      </p>
                      <button
                        className="min-h-11 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950"
                        type="submit"
                      >
                        Connect and analyze
                      </button>
                    </form>
                  </details>
                ) : (
                  <p className="mt-5 text-xs text-white/45">
                    Workspace owner permission is required to connect a
                    provider.
                  </p>
                )
              ) : (
                <div className="mt-5 grid gap-3">
                  <div className="rounded-xl border border-emerald-300/10 bg-emerald-300/[0.035] px-4 py-3">
                    <p className="m-0 text-xs font-semibold text-emerald-100/80">
                      {connection.lastSyncStatus === 'READY'
                        ? 'Connected'
                        : 'Connection needs a fresh check'}
                    </p>
                    <p className="m-0 mt-1 text-[11px] text-white/42">
                      Last checked {connection.lastSyncAt ?? connection.connectedAt}
                    </p>
                  </div>
                  {owner ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <form action={syncProviderAccount}>
                        <input
                          type="hidden"
                          name="organizationId"
                          value={organizationId}
                        />
                        <input type="hidden" name="provider" value={provider} />
                        <button
                          className="min-h-10 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white"
                          type="submit"
                        >
                          Check again
                        </button>
                      </form>
                      <form action={disconnectProviderAccount}>
                        <input
                          type="hidden"
                          name="organizationId"
                          value={organizationId}
                        />
                        <input type="hidden" name="provider" value={provider} />
                        <button
                          className="text-xs font-semibold text-white/45 underline decoration-white/20 underline-offset-4"
                          type="submit"
                        >
                          Disconnect
                        </button>
                      </form>
                    </div>
                  ) : null}
                </div>
              )}
            </article>
          );
        })}

        <article className="rounded-[22px] border border-white/[0.08] bg-[#0a0f16] p-5">
          <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-200/55">
            File
          </p>
          <h2 className="m-0 mt-2 text-xl font-semibold text-white">
            Upload CSV
          </h2>
          <p className="mt-3 text-sm leading-6 text-white/48">
            Use an existing export or the Evalomics template. Maximum 10 MiB and
            50,000 rows.
          </p>
          <form action={uploadUsageCsv} className="mt-5 grid gap-3">
            <input
              type="hidden"
              name="organizationId"
              value={organizationId}
            />
            <label className="grid gap-2 rounded-xl border border-dashed border-white/12 bg-white/[0.018] p-4 text-xs font-medium text-white/60">
              Choose usage CSV
              <input
                name="usageCsv"
                type="file"
                accept=".csv,text/csv"
                required
              />
            </label>
            <button
              className="min-h-11 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950"
              type="submit"
            >
              Upload and analyze
            </button>
          </form>
          <Link
            className="mt-3 inline-flex text-xs font-semibold text-blue-200/70"
            href="/usage-template.csv"
          >
            Download CSV template
          </Link>
        </article>
      </section>

      <section className="rounded-[22px] border border-white/[0.07] bg-white/[0.018] p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
        <div>
          <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
            Just exploring?
          </p>
          <h2 className="m-0 mt-2 text-lg font-semibold text-white">
            See Evalomics with synthetic usage
          </h2>
          <p className="m-0 mt-2 text-sm text-white/45">
            One click runs the demo through the same analysis path and keeps it
            clearly labeled as synthetic.
          </p>
        </div>
        <form action={analyzeDemoUsage} className="mt-4 sm:mt-0">
          <input
            type="hidden"
            name="organizationId"
            value={organizationId}
          />
          <button
            className="min-h-11 rounded-xl border border-white/12 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white"
            type="submit"
          >
            Try demo data
          </button>
        </form>
      </section>
    </div>
  );
}
