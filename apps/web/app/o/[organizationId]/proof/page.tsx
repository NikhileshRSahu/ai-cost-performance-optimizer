import { redirect } from 'next/navigation';
import { ArrowLeft, Download, ShieldCheck } from 'lucide-react';
import { createDatabase } from '../../../../../../src/persistence/database';
import { buildFounderDashboardView } from '../../../../../../src/workbench/dashboard-view';
import { buildProspectProofPack } from '../../../../../../src/workbench/prospect-proof';
import { EvalButton } from '../../../../components/ui/eval-button';
import { EvalSurface } from '../../../../components/ui/eval-surface';
import { EvidenceBadge } from '../../../../components/ui/evidence-badge';
import { StatusBanner } from '../../../../components/ui/status-banner';
import { EvidenceProgression } from '../../../../components/workbench/evidence-progression';
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

  return (
    <div className="grid gap-6">
      <header>
        <EvidenceBadge state={verified ? 'VERIFIED' : 'TESTED'} label={verified ? 'Production reconciled' : 'Verification incomplete'} />
        <h1 className="mt-4 max-w-3xl text-[clamp(2.4rem,5vw,4.8rem)] font-semibold leading-[.94] tracking-[-0.055em] text-white">
          What has actually been proven?
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-white/45">
          Evalomics separates measured production impact from modeled opportunity
          and benchmark evidence. If post-change evidence is not comparable, the
          saving does not become Verified.
        </p>
      </header>

      <EvidenceProgression current={verified ? 'VERIFIED' : strongest?.state === 'TESTED' ? 'TESTED' : 'POTENTIAL'} />

      <section className="grid gap-3 md:grid-cols-3">
        <EvalSurface tone="raised" className="p-5">
          <EvidenceBadge state="OBSERVED" />
          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.13em] text-white/30">
            Observed spend
          </p>
          <p className="mt-3 font-mono text-2xl font-medium text-white/86">
            {pack.observedSpend === null
              ? 'Unavailable'
              : `${pack.observedSpend.currency} ${pack.observedSpend.amount}`}
          </p>
        </EvalSurface>

        <EvalSurface tone="amber" className="p-5">
          <EvidenceBadge
            state={strongest?.state === 'VERIFIED' ? 'VERIFIED' : strongest?.state === 'TESTED' ? 'TESTED' : 'POTENTIAL'}
            label={strongest?.stateLabel ?? 'Potential'}
          />
          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.13em] text-white/30">
            Strongest finding
          </p>
          <p className="mt-3 text-lg font-semibold text-white/82">
            {strongest?.title ?? 'No active finding'}
          </p>
        </EvalSurface>

        <EvalSurface tone={verified ? 'verified' : 'default'} className="p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck
              className={verified ? 'size-4 text-[var(--eval-verified)]' : 'size-4 text-white/25'}
            />
            <EvidenceBadge state="VERIFIED" />
          </div>
          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.13em] text-white/30">
            Verified net impact
          </p>
          <p className={verified ? 'mt-3 font-mono text-2xl font-medium text-[var(--eval-verified)]' : 'mt-3 font-mono text-2xl font-medium text-white/45'}>
            {pack.verifiedNetSavings === null
              ? 'Not verified'
              : `${pack.verifiedNetSavings.currency} ${pack.verifiedNetSavings.numerator}/${pack.verifiedNetSavings.denominator}`}
          </p>
        </EvalSurface>
      </section>

      {pack.limitations.length > 0 ? (
        <StatusBanner
          tone="opportunity"
          title="Why verification is limited"
          detail={
            <ul className="m-0 mt-2 grid gap-1.5 pl-4">
              {pack.limitations.map((limitation) => (
                <li key={limitation}>{limitation}</li>
              ))}
            </ul>
          }
        />
      ) : null}

      <EvalSurface tone="raised" className="p-5 sm:p-6">
        <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-300/60">
          Evidence snapshot
        </p>
        {pack.diagnosticFacts.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pack.diagnosticFacts.slice(0, 6).map((fact) => (
              <EvalSurface
                key={`${fact.label}:${fact.evidenceRef ?? 'none'}`}
                tone="subtle"
                className="p-4"
              >
                <p className="m-0 text-xs text-white/35">{fact.label}</p>
                <p className="m-0 mt-2 font-mono text-sm font-semibold text-white/72">
                  {fact.value}
                </p>
              </EvalSurface>
            ))}
          </div>
        ) : (
          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/45">
            No diagnostic evidence is available yet. Import usage evidence before
            expecting a verification snapshot or downloadable proof pack.
          </p>
        )}
      </EvalSurface>

      <div className="flex flex-wrap gap-2.5">
        <EvalButton href={`/o/${organizationId}/proof/download`}>
          <Download className="size-3.5" /> Download evidence pack
        </EvalButton>
        <EvalButton href={`/o/${organizationId}`} variant="secondary">
          <ArrowLeft className="size-3.5" /> Back to results
        </EvalButton>
      </div>
    </div>
  );
}
