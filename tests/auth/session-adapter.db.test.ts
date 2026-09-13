import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createPasswordlessSessionAdapter } from '../../src/auth/session-adapter.js';
import { createDatabase } from '../../src/persistence/database.js';
import { createMembershipRepository } from '../../src/persistence/repositories/index.js';
import {
  memberships,
  organizations,
  users,
} from '../../src/persistence/schema.js';

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined) {
  throw new Error('DATABASE_URL_REQUIRED_FOR_DB_TESTS');
}

const database = createDatabase(databaseUrl);
const membershipRepository = createMembershipRepository(database.db);
const adapter = createPasswordlessSessionAdapter(membershipRepository);

describe('passwordless session persistence', () => {
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
    await database.db.insert(users).values({
      id: 'user-1',
      email: 'founder@example.com',
      authProvider: 'magic-link',
      authSubject: 'subject-1',
    });
    await database.db.insert(memberships).values([
      { organizationId: 'org-a', userId: 'user-1', role: 'OWNER' },
      { organizationId: 'org-b', userId: 'user-1', role: 'VIEWER' },
    ]);
  });

  afterAll(async () => {
    await database.close();
  });

  it('derives the full authenticated session from persisted memberships', async () => {
    await expect(
      adapter.resolve({
        provider: 'magic-link',
        subject: 'subject-1',
        email: 'FOUNDER@EXAMPLE.COM',
        emailVerified: true,
      }),
    ).resolves.toEqual({
      userId: 'user-1',
      memberships: [
        { organizationId: 'org-a', role: 'OWNER' },
        { organizationId: 'org-b', role: 'VIEWER' },
      ],
    });
  });

  it('returns null for an unknown provider subject pair', async () => {
    await expect(
      adapter.resolve({
        provider: 'magic-link',
        subject: 'missing',
        email: 'founder@example.com',
        emailVerified: true,
      }),
    ).resolves.toBeNull();
  });
});
