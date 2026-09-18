import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BadgeDollarSign, Database, Sparkles } from 'lucide-react';
import { createDatabase } from '../../../../../../src/persistence/database';
import { buildFounderDashboardView } from '../../../../../../src/workbench/dashboard-view';
import { RecommendationCard } from '../../../../components/recommendation-card';
import { loadFounderDashboardEvidence } from '../../../../lib/dashboard-data';
import { resolveRuntimeSession } from '../../../../lib/runtime-session';

export const dynamic = 'force-dynamic';

export default async function RecommendationsPage({
  params,
}: Readonly<{ params: Promise<{ organizationId: string }> }>) {
  const { organizationId } = await params;
  const session = await resolveRuntimeSession();
  const databaseUrl = process.env.DATABASE_URL;
  if (session === null || databaseUrl === undefined) redirect('/unauthorized');

  const database = createDatabase(databaseUrl);
  let view;
  try {
    view = buildFounderDashboardView(
      await loadFounderDashboardEvidence(
        database.db,
        session,
        organizationId,
        Object.freeze({ source: 'AUTO' }),
      ),
    );
  } finally {
    await database.close();
  }

  const modeled =
    view.nonOverlappingModeledTotal === null
      ? 'Not measured'
      : `${view.nonOverlappingModeledTotal.currency} ${view.nonOverlappingModeledTotal.base}`;

  return (
    <div className="space-y-7">
      <section>
        <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
          Savings signal engine
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-100 sm:text-3xl">
          Recommendations without the dashboard maze.
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          Ranked actions from the current evidence window. Potential, tested,
          and verified savings remain different states.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/[0.07] bg-[#111a29] p-5">
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
            Signals found
          </p>
          <p className="mt-4 font-mono text-3xl text-slate-100">
            {view.recommendations.length}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.04] p-5">
          <p className="text-[10px] uppercase tracking-[0.16em] text-emerald-300/70">
            Modeled upside
          </p>
          <p className="mt-4 font-mono text-2xl text-emerald-300">{modeled}</p>
          <p className="mt-1 text-[10px] text-slate-500">
            Only shown when the evidence model supports it.
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-[#111a29] p-5">
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
            Method
          </p>
          <p className="mt-4 text-sm text-slate-200">Evidence-ranked actions</p>
          <p className="mt-1 text-xs text-slate-500">No black-box savings claim</p>
        </div>
      </div>

      {view.recommendations.length > 0 ? (
        <section className="grid gap-4">
          {view.recommendations.map((recommendation) => (
            <RecommendationCard
              key={recommendation.recommendationId}
              organizationId={organizationId}
              recommendation={recommendation}
            />
          ))}
        </section>
      ) : (
        <section className="rounded-xl border border-dashed border-white/[0.08] bg-[#111a29] px-6 py-14 text-center">
          <Sparkles className="mx-auto size-7 text-slate-600" />
          <p className="mt-4 text-sm font-medium text-slate-300">
            No supported recommendation yet
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Add usage evidence before Evalomics ranks a change.
          </p>
          <Link
            href={`/o/${organizationId}/import`}
            className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg bg-sky-400 px-4 py-2 text-xs font-semibold text-[#08101c] no-underline"
          >
            <Database className="size-3.5" />
            Add usage
          </Link>
        </section>
      )}

      <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 text-xs leading-5 text-slate-500">
        <BadgeDollarSign className="mr-2 inline size-3.5 text-emerald-300/70" />
        Modeled savings are planning evidence. Tested or verified states appear
        only after stronger proof exists.
      </div>
    </div>
  );
}
