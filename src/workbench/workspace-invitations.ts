import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { parseTrustedPasswordlessIdentity } from '../auth/contracts.js';
import { and, eq } from 'drizzle-orm';
import type { PersistenceDatabase } from '../persistence/database.js';
import {
  memberships,
  users,
  workspaceInvitations,
} from '../persistence/schema.js';
import { authorize, type AuthenticatedSession } from './authz.js';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function normalizeEmail(value: string): string {
  const email = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('INVALID_INVITE_EMAIL');
  }
  return email;
}

function assignableRole(value: string): 'OPERATOR' | 'VIEWER' {
  if (value !== 'OPERATOR' && value !== 'VIEWER') {
    throw new Error('INVALID_INVITE_ROLE');
  }
  return value;
}

export async function createWorkspaceInvitation(input: {
  db: PersistenceDatabase;
  session: AuthenticatedSession;
  organizationId: string;
  email: string;
  role: string;
  now?: Date;
}): Promise<Readonly<{ id: string; token: string; expiresAt: string }>> {
  const access = authorize(
    input.session,
    input.organizationId,
    'MANAGE_MEMBERSHIP',
  );
  if (!access.allowed || access.role !== 'OWNER')
    throw new Error('WORKSPACE_OWNER_REQUIRED');

  const email = normalizeEmail(input.email);
  const role = assignableRole(input.role);
  const token = randomBytes(32).toString('base64url');
  const now = input.now ?? new Date();
  const expires = new Date(
    now.getTime() + 7 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const id = randomUUID();

  await input.db.insert(workspaceInvitations).values({
    id,
    organizationId: input.organizationId,
    email,
    role,
    tokenHash: hashToken(token),
    status: 'PENDING',
    expiresAt: expires,
    createdByUserId: input.session.userId,
  });

  return Object.freeze({ id, token, expiresAt: expires });
}

export async function acceptWorkspaceInvitation(input: {
  db: PersistenceDatabase;
  session: AuthenticatedSession;
  token: string;
  now?: Date;
}): Promise<Readonly<{ organizationId: string; role: 'OPERATOR' | 'VIEWER' }>> {
  const tokenHash = hashToken(input.token.trim());
  const invitation = (
    await input.db
      .select()
      .from(workspaceInvitations)
      .where(
        and(
          eq(workspaceInvitations.tokenHash, tokenHash),
          eq(workspaceInvitations.status, 'PENDING'),
        ),
      )
      .limit(1)
  ).at(0);

  if (invitation === undefined) throw new Error('INVITE_NOT_FOUND');

  const now = input.now ?? new Date();
  if (new Date(invitation.expiresAt).getTime() <= now.getTime()) {
    await input.db
      .update(workspaceInvitations)
      .set({ status: 'EXPIRED' })
      .where(eq(workspaceInvitations.id, invitation.id));
    throw new Error('INVITE_EXPIRED');
  }

  const user = (
    await input.db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, input.session.userId))
      .limit(1)
  ).at(0);
  if (user === undefined) throw new Error('USER_NOT_FOUND');
  if (user.email.toLowerCase() !== invitation.email.toLowerCase())
    throw new Error('INVITE_EMAIL_MISMATCH');

  const role = invitation.role === 'OPERATOR' ? 'OPERATOR' : 'VIEWER';
  await input.db.transaction(async (tx) => {
    await tx
      .insert(memberships)
      .values({
        organizationId: invitation.organizationId,
        userId: input.session.userId,
        role,
      })
      .onConflictDoUpdate({
        target: [memberships.organizationId, memberships.userId],
        set: { role },
      });

    await tx
      .update(workspaceInvitations)
      .set({
        status: 'ACCEPTED',
        acceptedByUserId: input.session.userId,
        acceptedAt: now.toISOString(),
      })
      .where(eq(workspaceInvitations.id, invitation.id));
  });

  return Object.freeze({ organizationId: invitation.organizationId, role });
}


function stableUserId(provider: string, subject: string): string {
  const digest = createHash('sha256')
    .update(provider + '\n' + subject)
    .digest('hex')
    .slice(0, 24);
  return 'usr_' + digest;
}

export async function acceptWorkspaceInvitationForIdentity(input: {
  db: PersistenceDatabase;
  identity: unknown;
  token: string;
  now?: Date;
}): Promise<Readonly<{ organizationId: string; role: 'OPERATOR' | 'VIEWER' }>> {
  const identity = parseTrustedPasswordlessIdentity(input.identity);
  const tokenHash = hashToken(input.token.trim());
  const now = input.now ?? new Date();

  return input.db.transaction(async (tx) => {
    const invitation = (
      await tx
        .select()
        .from(workspaceInvitations)
        .where(
          and(
            eq(workspaceInvitations.tokenHash, tokenHash),
            eq(workspaceInvitations.status, 'PENDING'),
          ),
        )
        .limit(1)
    ).at(0);

    if (invitation === undefined) throw new Error('INVITE_NOT_FOUND');
    if (new Date(invitation.expiresAt).getTime() <= now.getTime()) {
      await tx
        .update(workspaceInvitations)
        .set({ status: 'EXPIRED' })
        .where(eq(workspaceInvitations.id, invitation.id));
      throw new Error('INVITE_EXPIRED');
    }
    if (identity.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new Error('INVITE_EMAIL_MISMATCH');
    }

    let user = (
      await tx
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(
          and(
            eq(users.authProvider, identity.provider),
            eq(users.authSubject, identity.subject),
          ),
        )
        .limit(1)
    ).at(0);

    if (user === undefined) {
      const emailOwner = (
        await tx
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, identity.email))
          .limit(1)
      ).at(0);
      if (emailOwner !== undefined) {
        throw new Error('AUTH_EMAIL_IDENTITY_CONFLICT');
      }

      const id = stableUserId(identity.provider, identity.subject);
      await tx.insert(users).values({
        id,
        email: identity.email,
        authProvider: identity.provider,
        authSubject: identity.subject,
      });
      user = { id, email: identity.email };
    }

    const role = invitation.role === 'OPERATOR' ? 'OPERATOR' : 'VIEWER';
    await tx
      .insert(memberships)
      .values({
        organizationId: invitation.organizationId,
        userId: user.id,
        role,
      })
      .onConflictDoUpdate({
        target: [memberships.organizationId, memberships.userId],
        set: { role },
      });

    await tx
      .update(workspaceInvitations)
      .set({
        status: 'ACCEPTED',
        acceptedByUserId: user.id,
        acceptedAt: now.toISOString(),
      })
      .where(eq(workspaceInvitations.id, invitation.id));

    return Object.freeze({
      organizationId: invitation.organizationId,
      role,
    });
  });
}
