import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, ArrowRight, Link2, UploadCloud } from 'lucide-react';
import { createDatabase } from '../../../../../../src/persistence/database';
import { listProviderConnections } from '../../../../../../src/persistence/repositories/provider-connections';
import { requireOrganizationAccess } from '../../../../../../src/persistence/tenant';
import { CsvDropzone } from '../../../../components/workbench/csv-dropzone';
import { resolveRuntimeSession } from '../../../../lib/runtime-session';
import {
  connectProviderAccount,
  disconnectProviderAccount,
  syncProviderAccount,
  uploadUsageCsv,
} from './action';

export const dynamic = 'force-dynamic';

function providerErrorCopy(code: string | undefined): string | null {
  if (code === undefined) return null;
  if (code === 'PROVIDER_CREDENTIAL_REJECTED')
    return 'The provider rejected this Admin API key. Check that it can read organization usage and costs.';
  if (code === 'PROVIDER_RATE_LIMITED')
    return 'The provider rate-limited the connection check. Try again shortly.';
  if (code === 'PROVIDER_CONNECTION_NOT_CONFIGURED')
    return 'Provider connections are not fully configured on this Evalomics deployment yet.';
  if (code === 'PROVIDER_TEMPORARY_ERROR')
    return 'A temporary database connection interruption stopped the sync. Try again.';
  if (code === 'PROVIDER_CONNECTION_REQUIRED')
    return 'This provider is not connected anymore. Connect it again to analyze usage.';
  return 'Evalomics could not validate this provider connection. Nothing was saved.';
}

function displayUtc(value: string): string {
  return value.replace('T', ' ').slice(0, 16) + ' UTC';
}

function ProviderLogo({ provider }: { provider: 'OPENAI' | 'ANTHROPIC' }) {
  return (
    <img
      alt=""
      aria-hidden="true"
      width={24}
      height={24}
      src={provider === 'OPENAI' ? '/brand/openai.svg' : '/brand/anthropic.svg'}
    />
  );
}

export default async function ImportPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{
    mode?: string;
    provider?: string;
    error?: string;
    providerError?: string;
    providerDisconnected?: string;
    demo?: string;
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
    (m) => m.organizationId === organizationId && m.role === 'OWNER',
  );
  const providerError = providerErrorCopy(query.providerError);
  const demoMode = query.demo === 'true';
  const mode = demoMode
    ? 'csv'
    : query.mode === 'connect' || query.mode === 'csv'
      ? query.mode
      : null;
  const selectedProvider =
    query.provider === 'OPENAI' || query.provider === 'ANTHROPIC'
      ? query.provider
      : null;

  return (
    <div className="grid gap-6">
      <header className="border-b border-white/[0.07] pb-6">
        <Link
          href="/start"
          className="inline-flex items-center gap-2 text-xs font-semibold text-white/38 no-underline hover:text-white"
        >
          <ArrowLeft className="size-3.5" /> Change source
        </Link>
        <p className="m-0 mt-5 text-[10px] font-semibold uppercase tracking-[0.17em] text-sky-300/70">
          Usage & Import
        </p>
        <h1 className="m-0 mt-2 !text-[clamp(2rem,4vw,3.2rem)] !leading-[1] !tracking-[-.045em] text-white">
          {mode === 'connect'
            ? 'Connect the source you chose'
            : demoMode
              ? 'Upload the synthetic demo CSV'
              : mode === 'csv'
                ? 'Upload your usage CSV'
                : 'Choose how to continue'}
        </h1>
        <p className="m-0 mt-3 max-w-2xl text-sm leading-6 text-white/45">
          {mode === 'connect'
            ? 'Choose a provider, connect usage and cost access, and let Evalomics analyze the returned evidence.'
            : demoMode
              ? 'This path is synthetic and stays labeled as demo evidence throughout the workflow.'
              : mode === 'csv'
                ? 'Drop a usage export, validate it, then analyze it.'
                : 'Connect a supported provider or upload a usage CSV.'}
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
          <p className="m-0">
            {query.error}
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link
              href="?mode=csv"
              className="text-xs font-semibold text-rose-50 underline decoration-rose-100/30 underline-offset-4"
            >
              Try another CSV
            </Link>
            <Link
              href={'/o/' + organizationId}
              className="text-xs font-semibold text-rose-50/75 underline decoration-rose-100/20 underline-offset-4"
            >
              Return to overview
            </Link>
          </div>
        </div>
      ) : null}
      {query.providerDisconnected !== undefined ? (
        <div
          className="rounded-xl border border-emerald-300/15 bg-emerald-300/[0.05] px-4 py-3 text-sm text-emerald-100/80"
          role="status"
        >
          {query.providerDisconnected} disconnected. Historical evidence remains
          available.
        </div>
      ) : null}

      {mode === null ? (
        <section className="grid gap-4 md:grid-cols-2">
          <Link
            href={'/o/' + organizationId + '/import?mode=connect'}
            className="group min-h-60 rounded-[26px] border border-white/[0.08] bg-white/[0.025] p-6 no-underline transition hover:-translate-y-1 hover:border-emerald-300/20"
          >
            <span className="grid size-12 place-items-center rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.055]">
              <Link2 className="size-5 text-emerald-200" />
            </span>
            <h2 className="m-0 mt-8 text-2xl font-semibold text-white">
              Connect
            </h2>
            <p className="m-0 mt-2 max-w-sm text-sm leading-6 text-white/43">
              Open a supported provider connection and let Evalomics fetch usage
              evidence.
            </p>
            <span className="mt-7 inline-flex items-center gap-2 text-xs font-semibold text-emerald-100/75">
              Choose provider{' '}
              <ArrowRight className="size-3.5 transition group-hover:translate-x-1" />
            </span>
          </Link>
          <Link
            href={'/o/' + organizationId + '/import?mode=csv'}
            className="group min-h-60 rounded-[26px] border border-white/[0.08] bg-white/[0.025] p-6 no-underline transition hover:-translate-y-1 hover:border-blue-300/20"
          >
            <span className="grid size-12 place-items-center rounded-2xl border border-blue-300/15 bg-blue-300/[0.055]">
              <UploadCloud className="size-5 text-blue-200" />
            </span>
            <h2 className="m-0 mt-8 text-2xl font-semibold text-white">
              Upload CSV
            </h2>
            <p className="m-0 mt-2 max-w-sm text-sm leading-6 text-white/43">
              Use a usage export. No provider key is required.
            </p>
            <span className="mt-7 inline-flex items-center gap-2 text-xs font-semibold text-blue-100/75">
              Choose a file{' '}
              <ArrowRight className="size-3.5 transition group-hover:translate-x-1" />
            </span>
          </Link>
        </section>
      ) : null}

      {mode === 'connect' ? (
        <section
          className="grid gap-4 lg:grid-cols-2"
          aria-label="Provider choices"
        >
          {(['OPENAI', 'ANTHROPIC'] as const).map((provider) => {
            const connection = connections.find(
              (candidate) =>
                candidate.provider === provider && candidate.revokedAt === null,
            );
            const label = provider === 'OPENAI' ? 'OpenAI' : 'Anthropic';
            const focused = selectedProvider === provider;
            return (
              <article
                key={provider}
                className={
                  focused
                    ? 'rounded-[26px] border border-emerald-300/20 bg-emerald-300/[0.035] p-5 shadow-[0_0_60px_rgba(110,231,183,.06)]'
                    : 'rounded-[26px] border border-white/[0.08] bg-white/[0.025] p-5'
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-12 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.04]">
                    <ProviderLogo provider={provider} />
                  </span>
                  <span className="rounded-full border border-emerald-300/15 bg-emerald-300/[0.055] px-2.5 py-1 text-[9px] font-semibold text-emerald-100/75">
                    {connection === undefined ? 'Available' : 'Connected'}
                  </span>
                </div>
                <h2 className="m-0 mt-6 text-xl font-semibold text-white">
                  {label}
                </h2>
                <p className="m-0 mt-2 text-sm leading-6 text-white/43">
                  Organization API usage and cost evidence. Prompt and response
                  content is not requested.
                </p>

                {connection === undefined ? (
                  owner ? (
                    <details
                      open={focused}
                      className="mt-5 overflow-hidden rounded-xl border border-white/[0.08] bg-black/15"
                    >
                      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-white">
                        {focused ? 'Enter Admin API key' : 'Connect ' + label}
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
                        <label className="grid gap-2 text-xs font-medium text-white/55">
                          Organization Admin API key
                          <input
                            className="min-h-12 rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white outline-none focus:border-emerald-300/35"
                            name="adminKey"
                            type="password"
                            autoComplete="off"
                            spellCheck={false}
                            required
                            placeholder={label + ' Admin key'}
                          />
                          <small className="text-[10px] leading-4 text-white/32">
                            Encrypted before storage. Disconnecting clears the
                            saved credential.
                          </small>
                        </label>
                        <button
                          className="min-h-12 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950"
                          type="submit"
                        >
                          Analyze my AI usage
                        </button>
                      </form>
                    </details>
                  ) : (
                    <p className="mt-5 text-xs text-white/38">
                      Workspace owner permission is required.
                    </p>
                  )
                ) : (
                  <div className="mt-5 grid gap-3">
                    <div className="rounded-xl border border-emerald-300/12 bg-emerald-300/[0.04] px-4 py-3">
                      <p className="m-0 text-xs font-semibold text-emerald-100/80">
                        Connected
                      </p>
                      <p className="m-0 mt-1 text-[11px] text-white/35">
                        Last checked{' '}
                        {displayUtc(
                          connection.lastSyncAt ?? connection.connectedAt,
                        )}
                      </p>
                    </div>
                    {owner ? (
                      <div className="flex flex-wrap gap-3">
                        <form action={syncProviderAccount}>
                          <input
                            type="hidden"
                            name="organizationId"
                            value={organizationId}
                          />
                          <input
                            type="hidden"
                            name="provider"
                            value={provider}
                          />
                          <button
                            className="min-h-10 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white"
                            type="submit"
                          >
                            Analyze my AI usage
                          </button>
                        </form>
                        <form action={disconnectProviderAccount}>
                          <input
                            type="hidden"
                            name="organizationId"
                            value={organizationId}
                          />
                          <input
                            type="hidden"
                            name="provider"
                            value={provider}
                          />
                          <button
                            className="min-h-10 px-2 text-xs font-semibold text-white/40"
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
        </section>
      ) : null}

      {mode === 'csv' ? (
        <section className="grid gap-5">
          <div className="rounded-[28px] border border-white/[0.08] bg-[#0a0f16] p-5 sm:p-7">
            {demoMode ? (
              <div className="mb-4 rounded-xl border border-amber-300/15 bg-amber-300/[0.05] px-4 py-3 text-xs font-semibold text-amber-100/80">
                Synthetic demo mode · never customer proof
              </div>
            ) : null}
            <CsvDropzone
              organizationId={organizationId}
              action={uploadUsageCsv}
              demo={demoMode}
            />
            <p className="m-0 mt-4 text-[11px] leading-5 text-white/35">
              No provider key required. We validate the file before adding it to
              your analysis.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-xs">
            <Link
              className="font-semibold text-blue-200/70"
              href="/usage-template.csv"
            >
              Download CSV template
            </Link>
            <Link
              className="font-semibold text-white/40"
              href={'/o/' + organizationId}
            >
              View my analysis
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
