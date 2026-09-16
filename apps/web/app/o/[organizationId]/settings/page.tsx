import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { createDatabase } from '../../../../../../src/persistence/database';
import { organizations } from '../../../../../../src/persistence/schema';
import { listWorkspaceInvitations } from '../../../../../../src/workbench/workspace-invitations';
import { listWorkspaceMembers } from '../../../../../../src/workbench/workspace-settings';
import { DeleteAccountButton } from '../../../../components/workbench/delete-account-button';
import { requireOrganizationContext } from '../../../../lib/organization-context';
import { resolveRuntimeSession } from '../../../../lib/runtime-session';
import {
  addMember,
  createInvite,
  changeMemberRole,
  permanentlyDeleteWorkspace,
  removeMember,
  revokeInvite,
  saveWorkspaceProfile,
  transferOwnership,
} from './action';

export const dynamic = 'force-dynamic';

const errorMessages: Record<string, string> = {
  MEMBER_MUST_SIGN_IN_FIRST:
    'That email has not signed in to Evalomics yet. Ask them to sign in once, then add them here.',
  INVALID_MEMBER_EMAIL: 'Enter a valid member email address.',
  INVALID_MEMBER_ROLE: 'Choose OPERATOR or VIEWER.',
  OWNER_ROLE_CANNOT_BE_CHANGED_HERE:
    'Use the Transfer ownership action to change the workspace owner.',
  OWNER_CANNOT_REMOVE_SELF: 'The workspace owner cannot remove themself.',
  OWNER_CANNOT_BE_REMOVED:
    'Owner removal is intentionally disabled in this beta.',
  WORKSPACE_DELETE_CONFIRMATION_MISMATCH:
    'Workspace deletion confirmation did not match.',
  INVALID_REPORTING_CURRENCY:
    'Use a three-letter currency code such as USD or INR.',
  INVALID_WORKSPACE_SETTING: 'One of the workspace settings is invalid.',
  INVALID_INVITE_EMAIL: 'Enter a valid invitation email.',
  INVALID_INVITE_ROLE: 'Choose OPERATOR or VIEWER for the invitation.',
  INVITE_NOT_PENDING: 'That invitation is no longer pending.',
  TARGET_ALREADY_OWNER: 'That member is already the owner.',
  MEMBERSHIP_NOT_FOUND: 'That workspace member no longer exists.',
  UNKNOWN: 'The requested workspace change could not be completed.',
};

export default async function SettingsPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{
    saved?: string;
    memberAdded?: string;
    memberUpdated?: string;
    memberRemoved?: string;
    error?: string;
    inviteToken?: string;
    inviteId?: string;
    inviteRevoked?: string;
    onboarding?: string;
    ownershipTransferred?: string;
  }>;
}>) {
  const { organizationId } = await params;
  const query = await searchParams;
  const session = await resolveRuntimeSession();
  const databaseUrl = process.env.DATABASE_URL;
  if (session === null || databaseUrl === undefined) redirect('/unauthorized');

  let context;
  try {
    context = requireOrganizationContext(session, organizationId);
  } catch {
    redirect('/unauthorized');
  }

  const database = createDatabase(databaseUrl);
  try {
    const organization = (
      await database.db
        .select({
          name: organizations.name,
          reportingCurrency: organizations.reportingCurrency,
          timezone: organizations.timezone,
        })
        .from(organizations)
        .where(eq(organizations.id, organizationId))
        .limit(1)
    ).at(0);

    if (organization === undefined) redirect('/unauthorized');

    const members = await listWorkspaceMembers({
      db: database.db,
      session,
      organizationId,
    });
    const isOwner = context.role === 'OWNER';
    const invitations = isOwner
      ? await listWorkspaceInvitations({
          db: database.db,
          session,
          organizationId,
        })
      : [];

    return (
      <div className="workflow-page workspace-settings-page">
        <header className="workflow-header">
          <div>
            <p className="eyebrow">Workspace settings</p>
            <h1>Manage the company, team, and lifecycle.</h1>
            <p className="lede">
              Keep ownership explicit, use least-privilege roles, and delete the
              workspace only when you intend to remove all tenant-scoped product
              data.
            </p>
          </div>
        </header>

        {query.onboarding === 'true' ? (
          <div className="evidence-note" role="status">
            <strong>Finish workspace setup.</strong> Confirm your company name,
            reporting currency, and timezone before importing production
            evidence.
          </div>
        ) : null}

        {query.error ? (
          <div className="blocking-note" role="alert">
            {errorMessages[query.error] ?? errorMessages.UNKNOWN}
          </div>
        ) : null}
        {query.saved === 'true' ||
        query.memberAdded === 'true' ||
        query.memberUpdated === 'true' ||
        query.memberRemoved === 'true' ||
        query.inviteRevoked === 'true' ||
        query.ownershipTransferred === 'true' ? (
          <div className="success-note" role="status">
            Workspace settings updated.
          </div>
        ) : null}

        <section className="workflow-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Organization profile</p>
              <h2>Reporting defaults</h2>
            </div>
          </div>
          {isOwner ? (
            <form action={saveWorkspaceProfile} className="upload-form">
              <input
                type="hidden"
                name="organizationId"
                value={organizationId}
              />
              {query.onboarding === 'true' ? (
                <input type="hidden" name="onboarding" value="true" />
              ) : null}
              <label>
                Workspace name
                <input
                  name="name"
                  defaultValue={organization.name}
                  maxLength={120}
                  required
                />
              </label>
              <label>
                Reporting currency
                <input
                  name="reportingCurrency"
                  defaultValue={organization.reportingCurrency}
                  maxLength={3}
                  required
                />
              </label>
              <label>
                Timezone
                <input
                  name="timezone"
                  defaultValue={organization.timezone}
                  maxLength={80}
                  required
                />
              </label>
              <button className="primary-button" type="submit">
                Save workspace
              </button>
            </form>
          ) : (
            <p className="blocking-note">
              Only the OWNER can edit workspace defaults.
            </p>
          )}
        </section>

        <section className="workflow-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Team access</p>
              <h2>Members and roles</h2>
            </div>
          </div>
          <div className="grid gap-3">
            {members.map((member) => (
              <article key={member.userId} className="mri-action">
                <div>
                  <strong>{member.email}</strong>
                  <p className="m-0 mt-1 text-sm opacity-70">{member.role}</p>
                </div>
                {isOwner && member.role !== 'OWNER' ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <form action={changeMemberRole} className="flex gap-2">
                      <input
                        type="hidden"
                        name="organizationId"
                        value={organizationId}
                      />
                      <input
                        type="hidden"
                        name="userId"
                        value={member.userId}
                      />
                      <select name="role" defaultValue={member.role}>
                        <option value="OPERATOR">OPERATOR</option>
                        <option value="VIEWER">VIEWER</option>
                      </select>
                      <button className="secondary-action" type="submit">
                        Update role
                      </button>
                    </form>
                    <form action={removeMember}>
                      <input
                        type="hidden"
                        name="organizationId"
                        value={organizationId}
                      />
                      <input
                        type="hidden"
                        name="userId"
                        value={member.userId}
                      />
                      <button className="danger-button" type="submit">
                        Remove
                      </button>
                    </form>
                    <form action={transferOwnership}>
                      <input
                        type="hidden"
                        name="organizationId"
                        value={organizationId}
                      />
                      <input
                        type="hidden"
                        name="userId"
                        value={member.userId}
                      />
                      <button className="secondary-action" type="submit">
                        Transfer ownership
                      </button>
                    </form>
                  </div>
                ) : null}
              </article>
            ))}
          </div>

          {isOwner ? (
            <div className="mt-6 grid gap-6 border-t pt-6">
              <div>
                <h3>Create invite link</h3>
                <p className="projection-note">
                  Generate a seven-day, email-bound invitation. Share the link
                  privately with the intended teammate.
                </p>
                {query.inviteToken ? (
                  <div className="mri-action">
                    <strong>Invite link created</strong>
                    <p className="mt-2 break-all font-mono text-xs">
                      /invite/{query.inviteToken}
                    </p>
                    <p className="mt-2 text-xs opacity-70">
                      Invite ID: {query.inviteId ?? 'created'}
                    </p>
                  </div>
                ) : null}
                <form action={createInvite} className="upload-form">
                  <input
                    type="hidden"
                    name="organizationId"
                    value={organizationId}
                  />
                  <label>
                    Invite email
                    <input name="email" type="email" maxLength={254} required />
                  </label>
                  <label>
                    Role
                    <select name="role" defaultValue="VIEWER">
                      <option value="VIEWER">VIEWER — read only</option>
                      <option value="OPERATOR">
                        OPERATOR — run evidence workflow
                      </option>
                    </select>
                  </label>
                  <button className="primary-button" type="submit">
                    Generate invite link
                  </button>
                </form>

                {invitations.length > 0 ? (
                  <div className="mt-6 grid gap-2">
                    <p className="eyebrow">Invitation history</p>
                    {invitations.map((invite) => (
                      <article key={invite.id} className="mri-action">
                        <div>
                          <strong>{invite.email}</strong>
                          <p className="m-0 mt-1 text-xs opacity-70">
                            {invite.role} · {invite.status} · expires{' '}
                            {new Date(invite.expiresAt).toLocaleDateString()}
                          </p>
                        </div>
                        {invite.status === 'PENDING' ? (
                          <form action={revokeInvite} className="mt-3">
                            <input
                              type="hidden"
                              name="organizationId"
                              value={organizationId}
                            />
                            <input
                              type="hidden"
                              name="invitationId"
                              value={invite.id}
                            />
                            <button className="danger-button" type="submit">
                              Revoke invite
                            </button>
                          </form>
                        ) : null}
                      </article>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="border-t pt-6">
                <h3>Add an existing Evalomics user</h3>
                <p className="projection-note">
                  During beta, the person must sign in to Evalomics once before
                  an OWNER can add their email to this workspace.
                </p>
                <form action={addMember} className="upload-form">
                  <input
                    type="hidden"
                    name="organizationId"
                    value={organizationId}
                  />
                  <label>
                    Member email
                    <input name="email" type="email" maxLength={254} required />
                  </label>
                  <label>
                    Role
                    <select name="role" defaultValue="VIEWER">
                      <option value="VIEWER">VIEWER — read only</option>
                      <option value="OPERATOR">
                        OPERATOR — run evidence workflow
                      </option>
                    </select>
                  </label>
                  <button className="primary-button" type="submit">
                    Add member
                  </button>
                </form>
              </div>
            </div>
          ) : null}
        </section>

        <section className="workflow-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Personal account</p>
              <h2>Delete your Evalomics account</h2>
            </div>
          </div>
          <p>
            Account deletion is permanent. If you own a workspace, delete that
            workspace first so shared tenant data is never removed accidentally.
          </p>
          <DeleteAccountButton />
        </section>

        <section className="workflow-card danger-zone">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Danger zone</p>
              <h2>Delete the entire workspace</h2>
            </div>
          </div>
          <p>
            Unlike evidence purge, this deletes the organization itself and all
            tenant-scoped records that cascade from it, including memberships.
            This action is not reversible.
          </p>
          {isOwner ? (
            <form action={permanentlyDeleteWorkspace} className="upload-form">
              <input
                type="hidden"
                name="organizationId"
                value={organizationId}
              />
              <label>
                Type <strong>{organizationId}</strong> to confirm
                <input
                  name="confirmationOrganizationId"
                  autoComplete="off"
                  required
                />
              </label>
              <button className="danger-button" type="submit">
                Permanently delete workspace
              </button>
            </form>
          ) : (
            <p className="blocking-note">
              Only the OWNER can delete the workspace.
            </p>
          )}
        </section>
      </div>
    );
  } finally {
    await database.close();
  }
}
