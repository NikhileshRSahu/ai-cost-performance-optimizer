import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createDatabase } from '../../../../../../src/persistence/database';
import {
  previewRetention,
  type RetentionPreview,
} from '../../../../../../src/workbench/retention-service';
import { requireOrganizationContext } from '../../../../lib/organization-context';
import { resolveRuntimeSession } from '../../../../lib/runtime-session';
import {
  configureRetention,
  enforceRetentionPolicy,
  purgeEvidence,
} from './action';

export const dynamic = 'force-dynamic';

export default async function DataPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{
    purged?: string;
    retentionUpdated?: string;
    retentionEnforced?: string;
  }>;
}>) {
  const { organizationId } = await params;
  const { purged, retentionUpdated, retentionEnforced } = await searchParams;
  const session = await resolveRuntimeSession();
  const databaseUrl = process.env.DATABASE_URL;
  if (session === null || databaseUrl === undefined) redirect('/unauthorized');

  let context;
  try {
    context = requireOrganizationContext(session, organizationId);
  } catch {
    redirect('/unauthorized');
  }

  const isOwner = context.role === 'OWNER';
  let retention: RetentionPreview | null = null;
  if (isOwner) {
    const database = createDatabase(databaseUrl);
    try {
      retention = await previewRetention({
        db: database.db,
        session,
        organizationId,
        now: new Date().toISOString(),
      });
    } finally {
      await database.close();
    }
  }

  return (
    <div className="workflow-page">
      <header className="workflow-header">
        <div>
          <p className="eyebrow">Data & privacy</p>
          <h1>Control your organization evidence</h1>
          <p className="lede">
            Export what the product stores, configure raw-evidence retention, or
            permanently purge organization evidence. Account and membership
            records remain so access control can continue to work.
          </p>
        </div>
      </header>

      {purged === 'true' ? (
        <div className="success-note" role="status">
          Organization evidence was purged.
        </div>
      ) : null}
      {retentionUpdated === 'true' ? (
        <div className="success-note" role="status">
          Raw-evidence retention policy was updated.
        </div>
      ) : null}
      {retentionEnforced === 'true' ? (
        <div className="success-note" role="status">
          Raw-evidence retention policy was enforced.
        </div>
      ) : null}

      <section className="workflow-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Export</p>
            <h2>Download organization evidence</h2>
          </div>
        </div>
        <p>
          The export includes workloads, imports, canonical usage evidence,
          recommendations, savings-state events, implementation records,
          verification windows, background-job metadata, and founding-pilot
          invoice requests, workspace invitations, and support requests.
        </p>
        {isOwner ? (
          <Link
            className="primary-action"
            href={'/o/' + organizationId + '/data/export'}
          >
            Download JSON export
          </Link>
        ) : (
          <p className="blocking-note">
            Only an organization owner can export data.
          </p>
        )}
      </section>

      <section className="workflow-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Retention</p>
            <h2>Control how long raw evidence is kept</h2>
          </div>
        </div>
        <p>
          Retention applies to raw usage records, import runs, and operational
          job metadata. Recommendations, benchmark decisions, implementation
          records, verification conclusions, and the savings-state audit trail
          remain available for accountability until you use full purge.
        </p>
        {isOwner && retention !== null ? (
          <>
            <form action={configureRetention} className="upload-form">
              <input
                type="hidden"
                name="organizationId"
                value={organizationId}
              />
              <label>
                Raw-evidence retention period
                <select
                  name="retentionDays"
                  defaultValue={
                    retention.retentionDays === null
                      ? 'disabled'
                      : String(retention.retentionDays)
                  }
                >
                  <option value="disabled">Disabled — keep until purge</option>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="180">180 days</option>
                  <option value="365">1 year</option>
                  <option value="730">2 years</option>
                  <option value="3650">10 years</option>
                </select>
              </label>
              <button className="primary-button" type="submit">
                Save retention policy
              </button>
            </form>

            {retention.enabled ? (
              <div className="mri-action">
                <p className="eyebrow">Dry-run preview</p>
                <h3>
                  {retention.totalRawEvidenceRows} raw evidence rows currently
                  fall before the cutoff
                </h3>
                <dl className="evidence-list">
                  <div>
                    <dt>Cutoff</dt>
                    <dd>{retention.cutoff}</dd>
                  </div>
                  <div>
                    <dt>Usage records</dt>
                    <dd>{retention.usageRecords}</dd>
                  </div>
                  <div>
                    <dt>Import runs</dt>
                    <dd>{retention.importRuns}</dd>
                  </div>
                  <div>
                    <dt>Operational jobs</dt>
                    <dd>{retention.jobs}</dd>
                  </div>
                  <div>
                    <dt>Last enforced</dt>
                    <dd>{retention.lastEnforcedAt ?? 'Never'}</dd>
                  </div>
                </dl>
                <form action={enforceRetentionPolicy}>
                  <input
                    type="hidden"
                    name="organizationId"
                    value={organizationId}
                  />
                  <button className="secondary-action" type="submit">
                    Enforce retention now
                  </button>
                </form>
              </div>
            ) : (
              <p className="projection-note">
                Automatic age-based deletion is disabled. Raw evidence remains
                until an owner enables retention or uses full purge.
              </p>
            )}
          </>
        ) : (
          <p className="blocking-note">
            Only an organization owner can configure or enforce retention.
          </p>
        )}
      </section>

      <section className="workflow-card danger-zone">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Danger zone</p>
            <h2>Purge imported and derived evidence</h2>
          </div>
        </div>
        <p>
          This permanently removes usage records, import runs, workloads,
          recommendations, implementation records, verification windows,
          savings-state events, job metadata, and pending founding-pilot invoice
          requests for this organization.
        </p>
        {isOwner ? (
          <form action={purgeEvidence} className="upload-form">
            <input type="hidden" name="organizationId" value={organizationId} />
            <label>
              Type <strong>{organizationId}</strong> to confirm
              <input
                name="confirmationOrganizationId"
                required
                autoComplete="off"
              />
            </label>
            <button className="danger-button" type="submit">
              Permanently purge evidence
            </button>
          </form>
        ) : (
          <p className="blocking-note">
            Only an organization owner can purge data.
          </p>
        )}
      </section>
    </div>
  );
}
