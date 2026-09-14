import { eq } from 'drizzle-orm';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createDatabase } from '../../../../../../../src/persistence/database';
import { designPartnerPermissions } from '../../../../../../../src/persistence/schema';
import { requireOrganizationContext } from '../../../../../lib/organization-context';
import { resolveRuntimeSession } from '../../../../../lib/runtime-session';
import { revokeRecordedProofPermission, submitProofPermission } from './action';

export const dynamic = 'force-dynamic';

export default async function ProofPermissionPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{ saved?: string; revoked?: string }>;
}>) {
  const { organizationId } = await params;
  const { saved, revoked } = await searchParams;
  const session = await resolveRuntimeSession();
  const databaseUrl = process.env.DATABASE_URL;
  if (session === null || databaseUrl === undefined) redirect('/unauthorized');

  const context = requireOrganizationContext(session, organizationId);
  const database = createDatabase(databaseUrl);
  let rows;
  try {
    rows = await database.db
      .select()
      .from(designPartnerPermissions)
      .where(eq(designPartnerPermissions.organizationId, organizationId));
  } finally {
    await database.close();
  }

  const isOwner = context.role === 'OWNER';

  return (
    <div className="workflow-page">
      <header className="workflow-header">
        <div>
          <p className="eyebrow">Proof permission registry</p>
          <h1>Record what the design partner actually approved.</h1>
          <p className="lede">
            This registry references written permission; it does not create
            permission by itself. Publication remains blocked unless the
            approved scope explicitly covers the intended use.
          </p>
        </div>
      </header>

      {saved === 'true' ? (
        <div className="success-note" role="status">
          Written permission reference recorded.
        </div>
      ) : null}
      {revoked === 'true' ? (
        <div className="success-note" role="status">
          Permission marked revoked.
        </div>
      ) : null}

      <section className="workflow-card">
        <h2>Current records</h2>
        {rows.length === 0 ? (
          <p>No written design-partner permission is recorded.</p>
        ) : (
          <div className="workload-list">
            {rows.map((row) => (
              <article key={row.evidenceRef}>
                <div>
                  <strong>{row.evidenceRef}</strong>
                  <span>{row.status}</span>
                  <span>Scopes: {row.scopes.join(', ')}</span>
                  <span>Permission source: {row.writtenPermissionRef}</span>
                </div>
                {isOwner && row.status === 'GRANTED' ? (
                  <form action={revokeRecordedProofPermission}>
                    <input
                      type="hidden"
                      name="organizationId"
                      value={organizationId}
                    />
                    <input
                      type="hidden"
                      name="evidenceRef"
                      value={row.evidenceRef}
                    />
                    <button className="secondary-action" type="submit">
                      Revoke recorded permission
                    </button>
                  </form>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>

      {isOwner ? (
        <section className="workflow-card">
          <h2>Record written permission</h2>
          <form action={submitProofPermission} className="upload-form">
            <input type="hidden" name="organizationId" value={organizationId} />
            <label>
              Evidence reference
              <input name="evidenceRef" required maxLength={240} />
            </label>
            <label>
              Written permission reference
              <input
                name="writtenPermissionRef"
                required
                maxLength={500}
                placeholder="email thread ID, document reference, or approved record"
              />
            </label>
            <label>
              Permission granted at
              <input name="grantedAt" type="datetime-local" required />
            </label>
            <fieldset className="attestation-group">
              <legend>Approved scope</legend>
              <label className="checkbox-row">
                <input type="checkbox" name="scopes" value="PRIVATE_SALES" />
                Private sales conversations
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  name="scopes"
                  value="PUBLIC_CASE_STUDY"
                />
                Public case study
              </label>
              <label className="checkbox-row">
                <input type="checkbox" name="scopes" value="TESTIMONIAL" />
                Testimonial or quote
              </label>
            </fieldset>
            <button className="primary-button" type="submit">
              Record permission reference
            </button>
          </form>
        </section>
      ) : (
        <p className="blocking-note">
          Only the organization OWNER can record or revoke proof permission.
        </p>
      )}

      <Link className="secondary-action" href={`/o/${organizationId}/proof`}>
        Back to proof pack
      </Link>
    </div>
  );
}
