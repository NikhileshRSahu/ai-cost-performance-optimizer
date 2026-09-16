import { redirect } from 'next/navigation';
import { createDatabase } from '../../../../../src/persistence/database';
import { listPilotInvoiceRequests } from '../../../../../src/workbench/pilot-admin';
import { requireAdminAccess } from '../../../lib/admin-access';
import { resolveRuntimeSession } from '../../../lib/runtime-session';
import { updatePilotInvoiceStatus } from './action';

export const dynamic = 'force-dynamic';

export default async function PilotRequestsAdminPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ updated?: string }>;
}>) {
  const { updated } = await searchParams;
  const session = await resolveRuntimeSession();
  const databaseUrl = process.env.DATABASE_URL;
  if (session === null || databaseUrl === undefined) redirect('/unauthorized');

  const database = createDatabase(databaseUrl);
  try {
    await requireAdminAccess(database.db, session.userId);
    const requests = await listPilotInvoiceRequests(database.db);

    return (
      <main className="mx-auto grid min-h-screen max-w-6xl gap-6 bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Founder operations
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">
            Pilot invoice queue
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Manual invoicing is acceptable during the founding pilot, but every
            request must have an explicit operational state.
          </p>
        </header>

        {updated === 'true' ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            Invoice status updated.
          </div>
        ) : null}

        <section className="grid gap-4">
          {requests.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
              No founding-pilot invoice requests yet.
            </div>
          ) : (
            requests.map((request) => (
              <article
                key={request.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,.04)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="m-0 text-lg font-semibold">
                      {request.companyName}
                    </h2>
                    <p className="m-0 mt-1 text-sm text-slate-500">
                      {request.contactEmail}
                    </p>
                    <p className="m-0 mt-1 font-mono text-xs text-slate-400">
                      {request.organizationId}
                    </p>
                  </div>
                  <div className="text-right">
                    <strong className="font-mono text-xl">
                      {request.currency}{' '}
                      {(request.amountCents / 100).toFixed(0)}
                    </strong>
                    <p className="m-0 mt-1 text-xs text-slate-500">
                      {request.status}
                    </p>
                  </div>
                </div>

                <form
                  action={updatePilotInvoiceStatus}
                  className="mt-5 flex flex-wrap gap-2"
                >
                  <input type="hidden" name="id" value={request.id} />
                  <select
                    name="status"
                    defaultValue={request.status}
                    className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option value="REQUESTED">REQUESTED</option>
                    <option value="ISSUED">ISSUED</option>
                    <option value="PAID">PAID</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                  <button
                    type="submit"
                    className="min-h-10 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white"
                  >
                    Update status
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
