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
      <section className="eval-glass-card w-full rounded-[24px] p-7 text-white">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-200/75">
          Account
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-white">
          Your Evalomics identity
        </h1>
        <p className="mt-4 text-sm leading-6 text-white/45">
          Signed in as {input.email ?? 'your verified Google identity'}.
        </p>

        {workspaceDeleted === 'true' ? (
          <div
            className="mt-5 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.05] p-4 text-sm text-emerald-100/80"
            role="status"
          >
            Workspace deleted. You can now keep this account for future use or
            permanently delete the authentication identity below.
          </div>
        ) : null}

        <div className="mt-7 rounded-xl border border-rose-300/15 bg-rose-300/[0.05] p-5">
          <h2 className="m-0 text-lg font-semibold text-rose-100">
            Permanently delete account
          </h2>
          <p className="mt-2 text-sm leading-6 text-rose-100/60">
            You must first delete or transfer every workspace you own. Evalomics
            then removes your application profile and Better Auth identity.
          </p>
          <div className="mt-4">
            <DeleteAccountButton />
          </div>
        </div>

        <div className="mt-6">
          <Link href="/" className="text-sm font-semibold text-white/55 hover:text-white">
            Return to Evalomics
          </Link>
        </div>
      </section>
    </main>
  );
}
