import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
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
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="m-0 font-mono text-[10px] uppercase tracking-[0.14em] text-white/30">
            Model evaluation
          </p>
          <h1 className="m-0 mt-2 text-3xl font-semibold tracking-[-0.045em] text-white">
            Would switching models actually help?
          </h1>
          <p className="m-0 mt-2 max-w-2xl text-sm leading-6 text-white/42">
            Compare your current workload with another model. Evalomics will tell
            you whether the switch saves money or makes things worse.
          </p>
        </div>
        <Link
          href={'/o/' + organizationId + '/recommendations'}
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3.5 py-2 text-xs font-semibold text-white/65 no-underline transition hover:text-white"
        >
          <ArrowLeft className="size-3.5" /> Back to optimization
        </Link>
      </section>

      <WorkspaceModelCalculator
        currentModel={currentModel}
        workloadName={workloadName}
      />

    </div>
  );
}
