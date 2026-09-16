'use server';

import { redirect } from 'next/navigation';
import { createDatabase } from '../../../../../../src/persistence/database';
import {
  addExistingWorkspaceMember,
  changeWorkspaceMemberRole,
  deleteWorkspace,
  removeWorkspaceMember,
  updateWorkspaceProfile,
} from '../../../../../../src/workbench/workspace-settings';
import { createWorkspaceInvitation } from '../../../../../../src/workbench/workspace-invitations';
import { resolveRuntimeSession } from '../../../../lib/runtime-session';

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

async function runtime() {
  const session = await resolveRuntimeSession();
  const databaseUrl = process.env.DATABASE_URL;
  if (session === null || databaseUrl === undefined) redirect('/unauthorized');
  return { session, databaseUrl };
}

function errorCode(error: unknown): string {
  if (!(error instanceof Error)) return 'UNKNOWN';
  const allowed = new Set([
    'MEMBER_MUST_SIGN_IN_FIRST',
    'INVALID_MEMBER_EMAIL',
    'INVALID_MEMBER_ROLE',
    'OWNER_ROLE_CANNOT_BE_CHANGED_HERE',
    'OWNER_CANNOT_REMOVE_SELF',
    'OWNER_CANNOT_BE_REMOVED',
    'WORKSPACE_DELETE_CONFIRMATION_MISMATCH',
    'INVALID_REPORTING_CURRENCY',
    'INVALID_WORKSPACE_SETTING',
    'INVALID_INVITE_EMAIL',
    'INVALID_INVITE_ROLE',
  ]);
  return allowed.has(error.message) ? error.message : 'UNKNOWN';
}

export async function saveWorkspaceProfile(formData: FormData): Promise<never> {
  const organizationId = text(formData, 'organizationId');
  const { session, databaseUrl } = await runtime();
  const database = createDatabase(databaseUrl);
  try {
    await updateWorkspaceProfile({
      db: database.db,
      session,
      organizationId,
      name: text(formData, 'name'),
      reportingCurrency: text(formData, 'reportingCurrency'),
      timezone: text(formData, 'timezone'),
    });
  } catch (error) {
    redirect('/o/' + organizationId + '/settings?error=' + errorCode(error));
  } finally {
    await database.close();
  }
  redirect('/o/' + organizationId + '/settings?saved=true');
}

export async function addMember(formData: FormData): Promise<never> {
  const organizationId = text(formData, 'organizationId');
  const { session, databaseUrl } = await runtime();
  const database = createDatabase(databaseUrl);
  try {
    await addExistingWorkspaceMember({
      db: database.db,
      session,
      organizationId,
      email: text(formData, 'email'),
      role: text(formData, 'role'),
    });
  } catch (error) {
    redirect('/o/' + organizationId + '/settings?error=' + errorCode(error));
  } finally {
    await database.close();
  }
  redirect('/o/' + organizationId + '/settings?memberAdded=true');
}

export async function changeMemberRole(formData: FormData): Promise<never> {
  const organizationId = text(formData, 'organizationId');
  const { session, databaseUrl } = await runtime();
  const database = createDatabase(databaseUrl);
  try {
    await changeWorkspaceMemberRole({
      db: database.db,
      session,
      organizationId,
      userId: text(formData, 'userId'),
      role: text(formData, 'role'),
    });
  } catch (error) {
    redirect('/o/' + organizationId + '/settings?error=' + errorCode(error));
  } finally {
    await database.close();
  }
  redirect('/o/' + organizationId + '/settings?memberUpdated=true');
}

export async function removeMember(formData: FormData): Promise<never> {
  const organizationId = text(formData, 'organizationId');
  const { session, databaseUrl } = await runtime();
  const database = createDatabase(databaseUrl);
  try {
    await removeWorkspaceMember({
      db: database.db,
      session,
      organizationId,
      userId: text(formData, 'userId'),
    });
  } catch (error) {
    redirect('/o/' + organizationId + '/settings?error=' + errorCode(error));
  } finally {
    await database.close();
  }
  redirect('/o/' + organizationId + '/settings?memberRemoved=true');
}

export async function permanentlyDeleteWorkspace(
  formData: FormData,
): Promise<never> {
  const organizationId = text(formData, 'organizationId');
  const { session, databaseUrl } = await runtime();
  const database = createDatabase(databaseUrl);
  try {
    await deleteWorkspace({
      db: database.db,
      session,
      organizationId,
      confirmationOrganizationId: text(formData, 'confirmationOrganizationId'),
    });
  } catch (error) {
    redirect('/o/' + organizationId + '/settings?error=' + errorCode(error));
  } finally {
    await database.close();
  }
  redirect('/account?workspaceDeleted=true');
}

export async function createInvite(formData: FormData): Promise<never> {
  const organizationId = text(formData, 'organizationId');
  const { session, databaseUrl } = await runtime();
  const database = createDatabase(databaseUrl);
  let invite: Readonly<{ id: string; token: string; expiresAt: string }>;

  try {
    invite = await createWorkspaceInvitation({
      db: database.db,
      session,
      organizationId,
      email: text(formData, 'email'),
      role: text(formData, 'role'),
    });
  } catch (error) {
    redirect('/o/' + organizationId + '/settings?error=' + errorCode(error));
  } finally {
    await database.close();
  }

  redirect(
    '/o/' +
      organizationId +
      '/settings?inviteToken=' +
      encodeURIComponent(invite.token) +
      '&inviteId=' +
      encodeURIComponent(invite.id),
  );
}
