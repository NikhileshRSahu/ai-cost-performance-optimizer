import Link from 'next/link';
import { ArrowLeft, Download, ShieldCheck } from 'lucide-react';
import { redirect } from 'next/navigation';
import { formatDecimal, rational } from '../../../../../../src/economics/exact';
import { createDatabase } from '../../../../../../src/persistence/database';
import { buildFounderDashboardView } from '../../../../../../src/workbench/dashboard-view';
import { buildProspectProofPack } from '../../../../../../src/workbench/prospect-proof';
import { loadFounderDashboardEvidence } from '../../../../lib/dashboard-data';
import { resolveRuntimeSession } from '../../../../lib/runtime-session';

export const dynamic = 'force-dynamic';

export default async function VerificationPage({
  params,
}: Readonly<{ params: Promise<{ organizationId: string }> }>) {
  const { organizationId } = await params;
  const session = await resolveRuntimeSession();
  const databaseUrl = process.env.DATABASE_URL;
  if (session === null || databaseUrl === undefined) redirect('/unauthorized');

  const database = createDatabase(databaseUrl);
  let pack;
  try {
    const evidence = await loadFounderDashboardEvidence(
      database.db,
      session,
      organizationId,
    );
    pack = buildProspectProofPack(buildFounderDashboardView(evidence));
  } finally {
    await database.close();
  }

  const verified = pack.verifiedNetSavings !== null;
  const strongest = pack.strongestFinding;
  const verifiedAmount =
    pack.verifiedNetSavings === null
      ? null
      : formatDecimal(
          rational(
            BigInt(pack.verifiedNetSavings.numerator),
            BigInt(pack.verifiedNetSavings.denominator),
          ),
          2,
        );

  return (
    <div className="workflow-page proof-page grid gap-6">
      <header className="workflow-header">
        <div>
          <p className="eyebrow">Production result</p>
          <h1>What did the change actually achieve?</h1>
          <p className="lede">
            See the measured production outcome after rollout. If the change has
            not been deployed yet, Evalomics will show exactly what is still
            missing instead of pretending there is a result.
          </p>
        </div>
        <span className="trust-chip">
          {verified
            ? 'Verified production evidence'
            : 'Production proof pending'}
        </span>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
          <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.13em] text-white/30">
            Observed spend
          </p>
          <p className="m-0 mt-3 font-mono text-2xl font-medium text-white/82">
            {pack.observedSpend === null
              ? 'Unavailable'
              : `${pack.observedSpend.currency} ${pack.observedSpend.amount}`}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-300/12 bg-amber-300/[0.035] p-5">
          <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.13em] text-amber-200/45">
            Can I trust this yet?
          </p>
          <p className="m-0 mt-3 text-lg font-semibold text-amber-50/82">
            {strongest?.stateLabel ?? 'No active finding'}
          </p>
          <p className="m-0 mt-1 text-xs leading-5 text-amber-50/40">
            {strongest?.title ?? 'No recommendation has enough evidence yet.'}
          </p>
        </div>

        <div
          className={
            verified
              ? 'rounded-2xl border border-emerald-300/18 bg-emerald-300/[0.05] p-5'
              : 'rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5'
          }
        >
          <div className="flex items-center gap-2">
            <ShieldCheck
              className={
                verified ? 'size-4 text-emerald-200/70' : 'size-4 text-white/30'
              }
            />
            <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.13em] text-white/30">
              What changed in production?
            </p>
          </div>
          <p
            className={
              verified
                ? 'm-0 mt-3 font-mono text-2xl font-medium text-emerald-100'
                : 'm-0 mt-3 font-mono text-2xl font-medium text-white/55'
            }
          >
            {pack.verifiedNetSavings === null || verifiedAmount === null
              ? 'Pending after rollout'
              : `${pack.verifiedNetSavings.currency} ${verifiedAmount}`}
          </p>
        </div>
      </section>

      {pack.limitations.length > 0 ? (
        <section className="rounded-2xl border border-amber-300/12 bg-amber-300/[0.035] p-5">
          <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-200/45">
            What would strengthen this result
          </p>
          <ul className="mt-3 grid gap-1.5 pl-5 text-xs leading-5 text-amber-50/45">
            {pack.limitations.map((limitation) => (
              <li key={limitation}>{limitation}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {pack.diagnosticFacts.length > 0 ? (
        <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
          <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/28">
            Evidence snapshot
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {pack.diagnosticFacts.slice(0, 6).map((fact) => (
              <div
                key={`${fact.label}:${fact.evidenceRef ?? 'none'}`}
                className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4"
              >
                <p className="m-0 text-xs text-white/35">{fact.label}</p>
                <p className="m-0 mt-2 font-mono text-sm font-semibold text-white/72">
                  {fact.value}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
          <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/28">
            Evidence snapshot
          </p>
          <p className="m-0 mt-3 max-w-2xl text-sm leading-6 text-white/55">
            No diagnostic evidence is available yet. Import usage evidence so
            Evalomics can build an evidence-backed optimization result.
          </p>
        </section>
      )}

      <div className="flex flex-wrap gap-2.5">
        <Link
          className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-slate-950 no-underline"
          href={`/o/${organizationId}/proof/download`}
        >
          <Download className="size-3.5" />
          {verified
            ? 'Download verified evidence pack'
            : 'Download evidence snapshot'}
        </Link>
        <Link
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-2 text-xs font-semibold text-white/65 no-underline"
          href={`/o/${organizationId}`}
        >
          <ArrowLeft className="size-3.5" />
          Back to overview
        </Link>
      </div>
    </div>
  );
}
