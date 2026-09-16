import { redirect } from 'next/navigation';
import { resolveRuntimeSession } from '../../lib/runtime-session';
import { acceptInvite } from './action';

const messages: Record<string, string> = {
  INVITE_NOT_FOUND: 'This invitation is invalid or has already been used.',
  INVITE_EXPIRED: 'This invitation has expired. Ask the workspace owner for a new link.',
  INVITE_EMAIL_MISMATCH: 'This invitation was issued to a different email address.',
  USER_NOT_FOUND: 'Your Evalomics profile is not ready yet. Sign out and sign in again.',
  INVITE_FAILED: 'This invitation could not be accepted.',
};

export default async function InvitePage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}>) {
  const { token } = await params;
  const { error } = await searchParams;
  const session = await resolveRuntimeSession();

  if (session === null) {
    redirect('/login?returnTo=' + encodeURIComponent('/invite/' + token));
  }

  return (
    <main className="mx-auto grid min-h-[70vh] max-w-2xl place-items-center px-4 py-12">
      <section className="w-full rounded-[24px] border border-slate-200 bg-white p-7 shadow-[0_24px_80px_rgba(15,23,42,.08)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
          Workspace invitation
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-slate-950">
          Join this Evalomics workspace
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          Accepting this invitation adds your signed-in Evalomics identity to the
          workspace with the role chosen by its owner.
        </p>
        {error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
            {messages[error] ?? messages.INVITE_FAILED}
          </p>
        ) : null}
        <form action={acceptInvite} className="mt-6">
          <input type="hidden" name="token" value={token} />
          <button className="primary-button" type="submit">
            Accept invitation
          </button>
        </form>
      </section>
    </main>
  );
}
