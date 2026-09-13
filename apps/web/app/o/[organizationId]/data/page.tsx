import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireOrganizationContext } from '../../../lib/organization-context';
import { resolveRuntimeSession } from '../../../lib/runtime-session';
import { purgeEvidence } from './action';

export const dynamic = 'force-dynamic';

export default async function DataPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{ purged?: string }>;
}>) {
  const { organizationId } = await params;
  const { purged } = await searchParams;
  const session = await resolveRuntimeSession();
  if (session === null) redirect('/unauthorized');

  let context;
  try {
    context = requireOrganizationContext(session, organizationId);
  } catch {
    redirect('/unauthorized');
  }

  const isOwner = context.role === 'OWNER';

  return (
    <div className="workflow-page">
      <header className="workflow-header">
        <div>
          <p className="eyebrow">Data & privacy</p>
          <h1>Control your organization evidence</h1>
          <p className="lede">
            Export what the product stores for this organization or permanently
            purge imported and derived evidence. Account and membership records
            remain so access control can continue to work.
          </p>
        </div>
      </header>

      {purged === 'true' ? (
        <div className="success-note" role="status">
          Organization evidence was purged.
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
          verification windows, and background-job metadata.
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
          savings-state events, and job metadata for this organization.
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
