import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { DeleteAccountButton } from '../../components/workbench/delete-account-button';
import { readBetterAuthIdentity } from '../../lib/better-auth-session';

export const dynamic = 'force-dynamic';

export default async function AccountPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ workspaceDeleted?: string }>;
}>) {
  const { workspaceDeleted } = await searchParams;
  const identity = await readBetterAuthIdentity(await headers());
  if (identity === null) redirect('/login?returnTo=/account');

  const input = identity.input as Readonly<{ email?: string }>;

  return (
    <main className="mx-auto grid min-h-[70vh] max-w-2xl place-items-center px-4 py-12">
      <section className="w-full rounded-[24px] border border-slate-200 bg-white p-7 shadow-[0_24px_80px_rgba(15,23,42,.08)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
          Account
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-slate-950">
          Your Evalomics identity
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          Signed in as {input.email ?? 'your verified Google identity'}.
        </p>

        {workspaceDeleted === 'true' ? (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900" role="status">
            Workspace deleted. You can now keep this account for future use or
            permanently delete the authentication identity below.
          </div>
        ) : null}

        <div className="mt-7 rounded-xl border border-red-200 bg-red-50 p-5">
          <h2 className="m-0 text-lg font-semibold text-red-950">
            Permanently delete account
          </h2>
          <p className="mt-2 text-sm leading-6 text-red-800">
            You must first delete or transfer every workspace you own. Evalomics
            then removes your application profile and Better Auth identity.
          </p>
          <div className="mt-4">
            <DeleteAccountButton />
          </div>
        </div>

        <div className="mt-6">
          <Link href="/" className="text-sm font-semibold text-slate-600">
            Return to Evalomics
          </Link>
        </div>
      </section>
    </main>
  );
}
