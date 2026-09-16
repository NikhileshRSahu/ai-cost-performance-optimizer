import { and, eq } from 'drizzle-orm';
import type { PersistenceDatabase } from '../persistence/database.js';
import {
  memberships,
  organizations,
  supportRequests,
  users,
} from '../persistence/schema.js';
import { authorize, type AuthenticatedSession, type Role } from './authz.js';

export type WorkspaceMember = Readonly<{
  userId: string;
  email: string;
  role: Role;
}>;

function requireOwner(
  session: AuthenticatedSession,
  organizationId: string,
): void {
  const result = authorize(session, organizationId, 'MANAGE_MEMBERSHIP');
  if (!result.allowed || result.role !== 'OWNER') {
    throw new Error('WORKSPACE_OWNER_REQUIRED');
  }
}

function bounded(value: string, maxLength: number): string {
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > maxLength) {
    throw new Error('INVALID_WORKSPACE_SETTING');
  }
  return trimmed;
}

function normalizedEmail(value: string): string {
  const email = bounded(value, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('INVALID_MEMBER_EMAIL');
  }
  return email;
}

function assignableRole(value: string): 'OPERATOR' | 'VIEWER' {
  if (value !== 'OPERATOR' && value !== 'VIEWER') {
    throw new Error('INVALID_MEMBER_ROLE');
  }
  return value;
}

export async function listWorkspaceMembers(input: {
  db: PersistenceDatabase;
  session: AuthenticatedSession;
  organizationId: string;
}): Promise<readonly WorkspaceMember[]> {
  const access = authorize(input.session, input.organizationId, 'READ');
  if (!access.allowed) throw new Error('ORGANIZATION_MEMBERSHIP_REQUIRED');

  const rows = await input.db
    .select({
      userId: memberships.userId,
      email: users.email,
      role: memberships.role,
    })
    .from(memberships)
    .innerJoin(users, eq(memberships.userId, users.id))
    .where(eq(memberships.organizationId, input.organizationId))
    .orderBy(users.email);

  return Object.freeze(rows.map((row) => Object.freeze(row)));
}

export async function updateWorkspaceProfile(input: {
  db: PersistenceDatabase;
  session: AuthenticatedSession;
  organizationId: string;
  name: string;
  reportingCurrency: string;
  timezone: string;
}): Promise<void> {
  requireOwner(input.session, input.organizationId);

  const reportingCurrency = bounded(input.reportingCurrency, 8).toUpperCase();
  if (!/^[A-Z]{3}$/.test(reportingCurrency)) {
    throw new Error('INVALID_REPORTING_CURRENCY');
  }

  const updated = await input.db
    .update(organizations)
    .set({
      name: bounded(input.name, 120),
      reportingCurrency,
      timezone: bounded(input.timezone, 80),
    })
    .where(eq(organizations.id, input.organizationId))
    .returning({ id: organizations.id });

  if (updated.length !== 1) throw new Error('ORGANIZATION_NOT_FOUND');
}

export async function addExistingWorkspaceMember(input: {
  db: PersistenceDatabase;
  session: AuthenticatedSession;
  organizationId: string;
  email: string;
  role: string;
}): Promise<WorkspaceMember> {
  requireOwner(input.session, input.organizationId);
  const email = normalizedEmail(input.email);
  const role = assignableRole(input.role);

  const [user] = await input.db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (user === undefined) throw new Error('MEMBER_MUST_SIGN_IN_FIRST');

  await input.db
    .insert(memberships)
    .values({
      organizationId: input.organizationId,
      userId: user.id,
      role,
    })
    .onConflictDoUpdate({
      target: [memberships.organizationId, memberships.userId],
      set: { role },
    });

  return Object.freeze({ userId: user.id, email: user.email, role });
}

export async function changeWorkspaceMemberRole(input: {
  db: PersistenceDatabase;
  session: AuthenticatedSession;
  organizationId: string;
  userId: string;
  role: string;
}): Promise<void> {
  requireOwner(input.session, input.organizationId);
  const role = assignableRole(input.role);

  if (input.userId === input.session.userId) {
    throw new Error('OWNER_ROLE_CANNOT_BE_CHANGED_HERE');
  }

  const existing = (
    await input.db
      .select({ role: memberships.role })
      .from(memberships)
      .where(
        and(
          eq(memberships.organizationId, input.organizationId),
          eq(memberships.userId, input.userId),
        ),
      )
      .limit(1)
  ).at(0);

  if (existing === undefined) throw new Error('MEMBERSHIP_NOT_FOUND');
  if (existing.role === 'OWNER')
    throw new Error('OWNER_ROLE_CANNOT_BE_CHANGED_HERE');

  await input.db
    .update(memberships)
    .set({ role })
    .where(
      and(
        eq(memberships.organizationId, input.organizationId),
        eq(memberships.userId, input.userId),
      ),
    );
}

export async function removeWorkspaceMember(input: {
  db: PersistenceDatabase;
  session: AuthenticatedSession;
  organizationId: string;
  userId: string;
}): Promise<void> {
  requireOwner(input.session, input.organizationId);

  if (input.userId === input.session.userId) {
    throw new Error('OWNER_CANNOT_REMOVE_SELF');
  }

  const existing = (
    await input.db
      .select({ role: memberships.role })
      .from(memberships)
      .where(
        and(
          eq(memberships.organizationId, input.organizationId),
          eq(memberships.userId, input.userId),
        ),
      )
      .limit(1)
  ).at(0);

  if (existing === undefined) return;
  if (existing.role === 'OWNER') throw new Error('OWNER_CANNOT_BE_REMOVED');

  await input.db
    .delete(memberships)
    .where(
      and(
        eq(memberships.organizationId, input.organizationId),
        eq(memberships.userId, input.userId),
      ),
    );
}

export async function deleteWorkspace(input: {
  db: PersistenceDatabase;
  session: AuthenticatedSession;
  organizationId: string;
  confirmationOrganizationId: string;
}): Promise<void> {
  requireOwner(input.session, input.organizationId);

  if (input.confirmationOrganizationId !== input.organizationId) {
    throw new Error('WORKSPACE_DELETE_CONFIRMATION_MISMATCH');
  }

  const deleted = await input.db.transaction(async (tx) => {
    await tx
      .delete(supportRequests)
      .where(eq(supportRequests.organizationId, input.organizationId));

    return tx
      .delete(organizations)
      .where(eq(organizations.id, input.organizationId))
      .returning({ id: organizations.id });
  });

  if (deleted.length !== 1) throw new Error('ORGANIZATION_NOT_FOUND');
}
