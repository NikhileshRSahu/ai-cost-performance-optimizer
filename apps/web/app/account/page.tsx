import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, ShieldCheck, Trash2 } from 'lucide-react';
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
    <main className="relative mx-auto grid min-h-[72vh] max-w-5xl place-items-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(99,222,244,.07),transparent_28%),radial-gradient(circle_at_82%_70%,rgba(61,235,190,.06),transparent_30%)]" />

      <section className="relative w-full overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#070b10] text-white shadow-[0_38px_120px_rgba(0,0,0,.34)]">
        <div className="border-b border-white/[0.07] px-6 py-6 sm:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-white/38 no-underline transition hover:text-white"
          >
            <ArrowLeft className="size-3.5" /> Back to Evalomics
          </Link>

          <div className="mt-8 max-w-2xl">
            <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300/75">
              Account
            </p>
            <h1 className="mt-3 text-[clamp(2.5rem,6vw,5rem)] font-semibold leading-[.94] tracking-[-.06em] text-white">
              Your Evalomics identity.
            </h1>
            <p className="mt-4 text-sm leading-6 text-white/45">
              Signed in as {input.email ?? 'your verified Google identity'}.
            </p>
          </div>
        </div>

        <div className="grid gap-4 p-6 sm:p-8 lg:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-[20px] border border-white/[0.08] bg-[linear-gradient(145deg,rgba(15,23,33,.94),rgba(8,12,17,.98))] p-6">
            <div className="flex items-center gap-2 text-emerald-200/80">
              <ShieldCheck className="size-4" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em]">
                Identity protected
              </span>
            </div>
            <h2 className="mt-8 text-xl font-semibold tracking-[-0.035em] text-white">
              Workspace identity
            </h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-white/42">
              Your sign-in identifies the private workspace used for provider
              connections, CSV analysis, benchmark evidence, and verification.
            </p>

            {workspaceDeleted === 'true' ? (
              <div
                className="mt-6 rounded-xl border border-emerald-300/18 bg-emerald-300/[0.055] p-4 text-sm leading-6 text-emerald-100"
                role="status"
              >
                Workspace deleted. You can keep this account for future use or
                permanently delete the authentication identity.
              </div>
            ) : null}
          </div>

          <div className="rounded-[20px] border border-red-300/12 bg-red-300/[0.035] p-6">
            <div className="flex items-center gap-2 text-red-200/80">
              <Trash2 className="size-4" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em]">
                Destructive action
              </span>
            </div>
            <h2 className="mt-8 text-xl font-semibold tracking-[-0.035em] text-white">
              Permanently delete account
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/42">
              First delete or transfer every workspace you own. Evalomics then
              removes your application profile and Better Auth identity.
            </p>
            <div className="mt-6">
              <DeleteAccountButton />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
