import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createDatabase } from '../../src/persistence/database.js';
import {
  memberships,
  organizations,
  users,
} from '../../src/persistence/schema.js';
import {
  addExistingWorkspaceMember,
  deleteWorkspace,
  removeWorkspaceMember,
  transferWorkspaceOwnership,
  updateWorkspaceProfile,
} from '../../src/workbench/workspace-settings.js';

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined) {
  throw new Error('DATABASE_URL_REQUIRED_FOR_DB_TESTS');
}

const database = createDatabase(databaseUrl);

const ownerSession = Object.freeze({
  userId: 'owner-user',
  memberships: Object.freeze([
    Object.freeze({ organizationId: 'org-1', role: 'OWNER' as const }),
  ]),
});

describe('workspace settings', () => {
  beforeAll(async () => {
    await database.migrate();
  });

  beforeEach(async () => {
    await database.db.delete(memberships);
    await database.db.delete(users);
    await database.db.delete(organizations);

    await database.db.insert(organizations).values({
      id: 'org-1',
      name: 'Original Workspace',
      reportingCurrency: 'USD',
      timezone: 'UTC',
      materialityTarget: '10',
      isDemo: false,
    });

    await database.db.insert(users).values([
      {
        id: 'owner-user',
        email: 'owner@example.com',
        authProvider: 'google',
        authSubject: 'owner-subject',
      },
      {
        id: 'member-user',
        email: 'member@example.com',
        authProvider: 'google',
        authSubject: 'member-subject',
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

  it('lets an owner add an existing user with least-privilege role', async () => {
    const member = await addExistingWorkspaceMember({
      db: database.db,
      session: ownerSession,
      organizationId: 'org-1',
      email: 'MEMBER@example.com',
      role: 'VIEWER',
    });

    expect(member).toEqual({
      userId: 'member-user',
      email: 'member@example.com',
      role: 'VIEWER',
    });

    const rows = await database.db.select().from(memberships);
    expect(rows).toHaveLength(2);
  });

  it('rejects adding an email that has never signed in', async () => {
    await expect(
      addExistingWorkspaceMember({
        db: database.db,
        session: ownerSession,
        organizationId: 'org-1',
        email: 'new-person@example.com',
        role: 'VIEWER',
      }),
    ).rejects.toThrow('MEMBER_MUST_SIGN_IN_FIRST');
  });

  it('does not allow the owner to remove themself', async () => {
    await expect(
      removeWorkspaceMember({
        db: database.db,
        session: ownerSession,
        organizationId: 'org-1',
        userId: 'owner-user',
      }),
    ).rejects.toThrow('OWNER_CANNOT_REMOVE_SELF');
  });

  it('updates organization reporting defaults', async () => {
    await updateWorkspaceProfile({
      db: database.db,
      session: ownerSession,
      organizationId: 'org-1',
      name: 'Acme AI',
      reportingCurrency: 'inr',
      timezone: 'Asia/Kolkata',
    });

    const [organization] = await database.db.select().from(organizations);
    expect(organization).toMatchObject({
      name: 'Acme AI',
      reportingCurrency: 'INR',
      timezone: 'Asia/Kolkata',
    });
    expect(organization?.onboardingCompletedAt).not.toBeNull();
  });

  it('deletes the workspace and cascades memberships', async () => {
    await addExistingWorkspaceMember({
      db: database.db,
      session: ownerSession,
      organizationId: 'org-1',
      email: 'member@example.com',
      role: 'OPERATOR',
    });

    await deleteWorkspace({
      db: database.db,
      session: ownerSession,
      organizationId: 'org-1',
      confirmationOrganizationId: 'org-1',
    });

    await expect(
      database.db.select().from(organizations),
    ).resolves.toHaveLength(0);
    await expect(database.db.select().from(memberships)).resolves.toHaveLength(
      0,
    );
    await expect(database.db.select().from(users)).resolves.toHaveLength(2);
  });

  it('transfers ownership atomically to an existing member', async () => {
    await addExistingWorkspaceMember({
      db: database.db,
      session: ownerSession,
      organizationId: 'org-1',
      email: 'member@example.com',
      role: 'VIEWER',
    });

    await transferWorkspaceOwnership({
      db: database.db,
      session: ownerSession,
      organizationId: 'org-1',
      targetUserId: 'member-user',
    });

    const rows = await database.db.select().from(memberships);
    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userId: 'owner-user', role: 'OPERATOR' }),
        expect.objectContaining({ userId: 'member-user', role: 'OWNER' }),
      ]),
    );
    expect(rows.filter((row) => row.role === 'OWNER')).toHaveLength(1);
  });

});
