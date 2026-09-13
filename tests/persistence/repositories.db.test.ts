import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createDatabase } from '../../src/persistence/database.js';
import {
  createMembershipRepository,
  createOrganizationRepository,
} from '../../src/persistence/repositories/index.js';
import {
  memberships,
  organizations,
  users,
} from '../../src/persistence/schema.js';
import type { AuthenticatedSession } from '../../src/workbench/authz.js';

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined) {
  throw new Error('DATABASE_URL_REQUIRED_FOR_DB_TESTS');
}

const database = createDatabase(databaseUrl);
const organizationRepository = createOrganizationRepository(database.db);
const membershipRepository = createMembershipRepository(database.db);

const sessionA: AuthenticatedSession = {
  userId: 'user-a',
  memberships: [{ organizationId: 'org-a', role: 'OWNER' }],
};
const sessionB: AuthenticatedSession = {
  userId: 'user-b',
  memberships: [{ organizationId: 'org-b', role: 'OWNER' }],
};

describe('organization-scoped repositories', () => {
  beforeAll(async () => {
    await database.migrate();
  });

  beforeEach(async () => {
    await database.db.delete(memberships);
    await database.db.delete(users);
    await database.db.delete(organizations);

    await database.db.insert(organizations).values([
      {
        id: 'org-a',
        name: 'Org A',
        reportingCurrency: 'USD',
        timezone: 'UTC',
        materialityTarget: '100',
      },
      {
        id: 'org-b',
        name: 'Org B',
        reportingCurrency: 'USD',
        timezone: 'UTC',
        materialityTarget: '100',
      },
    ]);
    await database.db.insert(users).values([
      {
        id: 'user-a',
        email: 'a@example.test',
        authProvider: 'test',
        authSubject: 'subject-a',
      },
      {
        id: 'user-b',
        email: 'b@example.test',
        authProvider: 'test',
        authSubject: 'subject-b',
      },
    ]);
    await database.db.insert(memberships).values([
      { organizationId: 'org-a', userId: 'user-a', role: 'OWNER' },
      { organizationId: 'org-b', userId: 'user-b', role: 'OWNER' },
    ]);
  });

  afterAll(async () => {
    await database.close();
  });

  it('returns only the organization authorized by the session', async () => {
    await expect(
      organizationRepository.get(sessionA, 'org-a'),
    ).resolves.toMatchObject({
      id: 'org-a',
      name: 'Org A',
    });
    await expect(organizationRepository.get(sessionA, 'org-b')).rejects.toThrow(
      'ORGANIZATION_MEMBERSHIP_REQUIRED',
    );
  });

  it('cannot list another tenant membership rows', async () => {
    await expect(
      membershipRepository.listForOrganization(sessionA, 'org-a'),
    ).resolves.toEqual([
      expect.objectContaining({
        organizationId: 'org-a',
        userId: 'user-a',
        role: 'OWNER',
      }),
    ]);
    await expect(
      membershipRepository.listForOrganization(sessionA, 'org-b'),
    ).rejects.toThrow('ORGANIZATION_MEMBERSHIP_REQUIRED');
  });

  it('cannot mutate another tenant organization', async () => {
    await expect(
      organizationRepository.updateMaterialityTarget(sessionA, 'org-b', '999'),
    ).rejects.toThrow('ORGANIZATION_MEMBERSHIP_REQUIRED');

    await expect(
      organizationRepository.updateMaterialityTarget(sessionB, 'org-b', '250'),
    ).resolves.toMatchObject({ id: 'org-b', materialityTarget: '250' });
  });
});
