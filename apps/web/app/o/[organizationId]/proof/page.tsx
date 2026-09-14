import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createDatabase } from '../../../../../../src/persistence/database';
import { buildFounderDashboardView } from '../../../../../../src/workbench/dashboard-view';
import { buildProspectProofPack } from '../../../../../../src/workbench/prospect-proof';
import { loadFounderDashboardEvidence } from '../../../../lib/dashboard-data';
import { resolveRuntimeSession } from '../../../../lib/runtime-session';

export const dynamic = 'force-dynamic';

export default async function ProspectProofPage({
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

  const ready = pack.classification === 'SANITIZED_PROSPECT_EVIDENCE';

  return (
    <div className="workflow-page">
      <header className="workflow-header">
        <div>
          <p className="eyebrow">Commercial proof pack</p>
          <h1>Turn evidence into something a prospect can trust.</h1>
          <p className="lede">
            This pack only reuses canonical organization evidence. Demo data
            stays demo, potential savings stay potential, and publication always
            requires explicit permission.
          </p>
        </div>
        <span className="trust-chip">{pack.classification}</span>
      </header>

      <section
        className={ready ? 'workflow-card' : 'workflow-card limitations'}
      >
        <h2>
          {ready ? 'Private prospect proof ready' : 'Proof claim blocked'}
        </h2>
        <p>{pack.commercialSummary}</p>
        <dl className="evidence-list">
          <div>
            <dt>Organization</dt>
            <dd>{pack.organizationName}</dd>
          </div>
          <div>
            <dt>Evidence window</dt>
            <dd>{pack.evidenceWindow}</dd>
          </div>
          <div>
            <dt>Data quality</dt>
            <dd>{pack.dataQuality}</dd>
          </div>
          <div>
            <dt>Customer-result claim</dt>
            <dd>
              {pack.customerResultClaimAllowed
                ? 'Allowed from evidence'
                : 'Blocked'}
            </dd>
          </div>
          <div>
            <dt>Publication</dt>
            <dd>Explicit written permission required</dd>
          </div>
        </dl>
      </section>

      <section className="workflow-card">
        <h2>Evidence snapshot</h2>
        <dl className="evidence-list">
          <div>
            <dt>Observed spend</dt>
            <dd>
              {pack.observedSpend === null
                ? 'Unavailable'
                : `${pack.observedSpend.currency} ${pack.observedSpend.amount}`}
            </dd>
          </div>
          <div>
            <dt>Strongest finding</dt>
            <dd>{pack.strongestFinding?.title ?? 'Unavailable'}</dd>
          </div>
          <div>
            <dt>Savings state</dt>
            <dd>{pack.strongestFinding?.stateLabel ?? 'Unavailable'}</dd>
          </div>
          <div>
            <dt>Verified net impact</dt>
            <dd>
              {pack.verifiedNetSavings === null
                ? 'Not verified'
                : `${pack.verifiedNetSavings.currency} ${pack.verifiedNetSavings.numerator}/${pack.verifiedNetSavings.denominator} · ${pack.verifiedNetSavings.direction}`}
            </dd>
          </div>
        </dl>
      </section>

      {pack.diagnosticFacts.length > 0 ? (
        <section className="workflow-card">
          <h2>Sanitized diagnostic facts</h2>
          <dl className="evidence-list">
            {pack.diagnosticFacts.map((fact) => (
              <div key={`${fact.label}:${fact.evidenceRef ?? 'none'}`}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {pack.limitations.length > 0 ? (
        <section className="limitations">
          <h2>Evidence limitations</h2>
          <ul>
            {pack.limitations.map((limitation) => (
              <li key={limitation}>{limitation}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="action-row">
        <Link
          className="primary-action"
          href={`/o/${organizationId}/proof/download`}
        >
          Download sanitized JSON proof pack
        </Link>
        <Link className="secondary-action" href={`/o/${organizationId}`}>
          Back to Work MRI
        </Link>
      </div>
    </div>
  );
}
