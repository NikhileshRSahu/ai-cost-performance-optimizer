import { redirect } from 'next/navigation';
import { createDatabase } from '../../../../../src/persistence/database';
import { listSupportRequests } from '../../../../../src/workbench/saas-operations';
import { requireAdminAccess } from '../../../lib/admin-access';
import { resolveRuntimeSession } from '../../../lib/runtime-session';
import { updateSupportStatus } from './action';

export const dynamic = 'force-dynamic';

export default async function SupportAdminPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ updated?: string }> }>) {
  const { updated } = await searchParams;
  const session = await resolveRuntimeSession();
  const databaseUrl = process.env.DATABASE_URL;
  if (session === null || databaseUrl === undefined) redirect('/unauthorized');

  const database = createDatabase(databaseUrl);
  try {
    await requireAdminAccess(database.db, session.userId);
    const requests = await listSupportRequests(database.db);

    return (
      <main className="mx-auto grid min-h-screen max-w-6xl gap-6 bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Founder operations
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">
            Support queue
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Every support, privacy, billing, bug, and security request has an
            explicit operational state.
          </p>
        </header>

        {updated === 'true' ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            Support status updated.
          </div>
        ) : null}

        <section className="grid gap-4">
          {requests.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
              No support requests yet.
            </div>
          ) : (
            requests.map((request) => (
              <article
                key={request.id}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="m-0 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                      {request.category}
                    </p>
                    <h2 className="mt-2 text-lg font-semibold">
                      {request.subject}
                    </h2>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                      {request.message}
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium">
                    {request.status}
                  </span>
                </div>
                <form
                  action={updateSupportStatus}
                  className="mt-5 flex flex-wrap gap-2"
                >
                  <input type="hidden" name="id" value={request.id} />
                  <select
                    name="status"
                    defaultValue={request.status}
                    className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                  <button
                    type="submit"
                    className="min-h-10 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white"
                  >
                    Update
                  </button>
                </form>
              </article>
            ))
          )}
        </section>
      </main>
    );
  } finally {
    await database.close();
  }
}
