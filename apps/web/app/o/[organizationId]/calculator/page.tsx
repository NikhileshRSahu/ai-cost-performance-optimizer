import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { createDatabase } from '../../../../../../src/persistence/database';
import { buildFounderDashboardView } from '../../../../../../src/workbench/dashboard-view';
import { WorkspaceModelCalculator } from '../../../../components/workbench/workspace-model-calculator';
import { loadFounderDashboardEvidence } from '../../../../lib/dashboard-data';
import { resolveRuntimeSession } from '../../../../lib/runtime-session';

export default async function ModelCalculatorPage({
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
      await loadFounderDashboardEvidence(database.db, session, organizationId),
    );
  } finally {
    await database.close();
  }

  const currentModel = view.bestFirstMove?.currentConfigurationId ?? null;
  const workloadName = view.bestFirstMove?.workloadName ?? null;

  return (
    <div className="space-y-7">
      <section>
        <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">
          Evalomics evaluation tool · model
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-100 sm:text-3xl">
          Evaluate a model candidate
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          Use this when Evalomics identifies model choice as the likely
          optimization. Compare the economics here, then return to the
          recommendation so the candidate can be judged alongside quality and
          performance evidence.
        </p>
      </section>

      <section className="rounded-[22px] border border-amber-300/12 bg-amber-300/[0.035] p-5">
        <p className="m-0 font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-amber-200/65">
          Where this fits
        </p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="m-0 text-lg font-semibold text-white">
              Found → compare model economics → Evalomics evaluates → decide
            </h2>
            <p className="m-0 mt-2 max-w-2xl text-sm leading-6 text-white/45">
              A cheaper model is only a candidate. Cost improvement becomes a
              recommendation only when the workload requirements are still met.
            </p>
          </div>
          <Link
            href={'/o/' + organizationId + '/recommendations'}
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-slate-950 no-underline"
          >
            Back to next action <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </section>

      <WorkspaceModelCalculator
        currentModel={currentModel}
        workloadName={workloadName}
      />

      <section className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="m-0 text-xs font-medium text-slate-300">
              Supporting calculators
            </p>
            <p className="m-0 mt-1 text-[11px] text-slate-500">
              Use these only when they support the optimization Evalomics
              already identified.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/tools/prompt-cache-savings"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3.5 py-2 text-xs font-semibold text-slate-300 no-underline transition hover:text-white"
            >
              Cache calculator <ExternalLink className="size-3.5" />
            </Link>
            <Link
              href="/tools/cost-per-outcome"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3.5 py-2 text-xs font-semibold text-slate-300 no-underline transition hover:text-white"
            >
              Cost per outcome <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
