import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { createDatabase } from '../../src/persistence/database.js';
import {
  memberships,
  organizations,
  users,
  workspaceInvitations,
} from '../../src/persistence/schema.js';
import {
  acceptWorkspaceInvitation,
  acceptWorkspaceInvitationForIdentity,
  createWorkspaceInvitation,
} from '../../src/workbench/workspace-invitations.js';

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined)
  throw new Error('DATABASE_URL_REQUIRED_FOR_DB_TESTS');
const database = createDatabase(databaseUrl);

const ownerSession = Object.freeze({
  userId: 'owner-user',
  memberships: Object.freeze([
    Object.freeze({ organizationId: 'org-1', role: 'OWNER' as const }),
  ]),
});

describe('workspace invitations', () => {
  beforeAll(async () => {
    await database.migrate();
  });

  beforeEach(async () => {
    await database.db.delete(workspaceInvitations);
    await database.db.delete(memberships);
    await database.db.delete(users);
    await database.db.delete(organizations);

    await database.db.insert(organizations).values({
      id: 'org-1',
      name: 'Acme',
      reportingCurrency: 'USD',
      timezone: 'UTC',
      materialityTarget: '10',
      isDemo: false,
    });
    await database.db.insert(users).values([
      {
        id: 'owner-user',
        email: 'owner@example.com',
        authProvider: 'better-auth/google',
        authSubject: 'owner-auth',
      },
      {
        id: 'member-user',
        email: 'member@example.com',
        authProvider: 'better-auth/google',
        authSubject: 'member-auth',
      },
    ]);
    await database.db.insert(memberships).values({
      organizationId: 'org-1',
      userId: 'owner-user',
      role: 'OWNER',
    });
  });

  afterAll(async () => {
    await database.close();
  });

  it('stores only a token hash and accepts the intended email', async () => {
    const invite = await createWorkspaceInvitation({
      db: database.db,
      session: ownerSession,
      organizationId: 'org-1',
      email: 'member@example.com',
      role: 'VIEWER',
      now: new Date('2026-09-16T00:00:00Z'),
    });

    const [stored] = await database.db.select().from(workspaceInvitations);
    expect(stored.tokenHash).not.toBe(invite.token);
    expect(stored.status).toBe('PENDING');

    const result = await acceptWorkspaceInvitation({
      db: database.db,
      session: Object.freeze({
        userId: 'member-user',
        memberships: Object.freeze([]),
      }),
      token: invite.token,
      now: new Date('2026-09-16T01:00:00Z'),
    });

    expect(result).toEqual({ organizationId: 'org-1', role: 'VIEWER' });
    const rows = await database.db.select().from(memberships);
    expect(rows).toHaveLength(2);
  });

  it('rejects a different signed-in email', async () => {
    const invite = await createWorkspaceInvitation({
      db: database.db,
      session: ownerSession,
      organizationId: 'org-1',
      email: 'member@example.com',
      role: 'OPERATOR',
    });

    await database.db.insert(users).values({
      id: 'other-user',
      email: 'other@example.com',
      authProvider: 'better-auth/google',
      authSubject: 'other-auth',
    });

    await expect(
      acceptWorkspaceInvitation({
        db: database.db,
        session: Object.freeze({
          userId: 'other-user',
          memberships: Object.freeze([]),
        }),
        token: invite.token,
      }),
    ).rejects.toThrow('INVITE_EMAIL_MISMATCH');
  });

  it('expires old invitations', async () => {
    const invite = await createWorkspaceInvitation({
      db: database.db,
      session: ownerSession,
      organizationId: 'org-1',
      email: 'member@example.com',
      role: 'VIEWER',
      now: new Date('2026-09-01T00:00:00Z'),
    });

    await expect(
      acceptWorkspaceInvitation({
        db: database.db,
        session: Object.freeze({
          userId: 'member-user',
          memberships: Object.freeze([]),
        }),
        token: invite.token,
        now: new Date('2026-09-16T00:00:00Z'),
      }),
    ).rejects.toThrow('INVITE_EXPIRED');
  });

  it('accepts a first-time auth identity without creating a personal workspace', async () => {
    const invite = await createWorkspaceInvitation({
      db: database.db,
      session: ownerSession,
      organizationId: 'org-1',
      email: 'fresh@example.com',
      role: 'OPERATOR',
      now: new Date('2026-09-16T00:00:00Z'),
    });

    const result = await acceptWorkspaceInvitationForIdentity({
      db: database.db,
      identity: {
        provider: 'better-auth/google',
        subject: 'fresh-auth-user',
        email: 'fresh@example.com',
        emailVerified: true,
      },
      token: invite.token,
      now: new Date('2026-09-16T01:00:00Z'),
    });

    expect(result).toEqual({ organizationId: 'org-1', role: 'OPERATOR' });

    const allOrganizations = await database.db.select().from(organizations);
    expect(allOrganizations).toHaveLength(1);

    const freshUser = (
      await database.db
        .select()
        .from(users)
        .where(eq(users.email, 'fresh@example.com'))
        .limit(1)
    ).at(0);
    expect(freshUser).toBeDefined();

    const freshMemberships = await database.db
      .select()
      .from(memberships)
      .where(eq(memberships.userId, freshUser!.id));
    expect(freshMemberships).toEqual([
      expect.objectContaining({
        organizationId: 'org-1',
        role: 'OPERATOR',
      }),
    ]);
  });

});
