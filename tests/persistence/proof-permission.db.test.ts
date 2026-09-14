import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createDatabase } from '../../src/persistence/database.js';
import {
  designPartnerPermissions,
  memberships,
  organizations,
  users,
} from '../../src/persistence/schema.js';
import type { AuthenticatedSession } from '../../src/workbench/authz.js';
import {
  recordProofPermission,
  revokeProofPermission,
} from '../../src/workbench/proof-permission.js';

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined) {
  throw new Error('DATABASE_URL_REQUIRED_FOR_DB_TESTS');
}

const database = createDatabase(databaseUrl);
const owner: AuthenticatedSession = {
  userId: 'proof-owner',
  memberships: [{ organizationId: 'proof-org', role: 'OWNER' }],
};

describe('design partner proof permission persistence', () => {
  beforeAll(async () => {
    await database.migrate();
  });

  beforeEach(async () => {
    await database.db.delete(designPartnerPermissions);
    await database.db.delete(memberships);
    await database.db.delete(users);
    await database.db.delete(organizations);

    await database.db.insert(organizations).values({
      id: 'proof-org',
      name: 'Proof Org',
      reportingCurrency: 'USD',
      timezone: 'UTC',
      materialityTarget: '100',
    });
    await database.db.insert(users).values({
      id: 'proof-owner',
      email: 'proof-owner@example.test',
      authProvider: 'test',
      authSubject: 'proof-owner',
    });
    await database.db.insert(memberships).values({
      organizationId: 'proof-org',
      userId: 'proof-owner',
      role: 'OWNER',
    });
  });

  afterAll(async () => {
    await database.close();
  });

  it('records explicit written permission scope without inferring broader rights', async () => {
    await recordProofPermission({
      db: database.db,
      session: owner,
      input: {
        organizationId: 'proof-org',
        evidenceRef: 'verification:v-1',
        writtenPermissionRef: 'email-thread:permission-1',
        scopes: ['PRIVATE_SALES'],
        grantedAt: '2026-09-14T12:00:00Z',
      },
    });

    const rows = await database.db.select().from(designPartnerPermissions);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      organizationId: 'proof-org',
      evidenceRef: 'verification:v-1',
      writtenPermissionRef: 'email-thread:permission-1',
      scopes: ['PRIVATE_SALES'],
      status: 'GRANTED',
    });
  });

  it('revokes the current permission record instead of deleting the audit reference', async () => {
    await recordProofPermission({
      db: database.db,
      session: owner,
      input: {
        organizationId: 'proof-org',
        evidenceRef: 'verification:v-1',
        writtenPermissionRef: 'email-thread:permission-1',
        scopes: ['PUBLIC_CASE_STUDY'],
        grantedAt: '2026-09-14T12:00:00Z',
      },
    });

    await revokeProofPermission({
      db: database.db,
      session: owner,
      organizationId: 'proof-org',
      evidenceRef: 'verification:v-1',
      revokedAt: '2026-09-14T13:00:00Z',
    });

    const row = (await database.db.select().from(designPartnerPermissions))[0];
    expect(row).toMatchObject({
      status: 'REVOKED',
      writtenPermissionRef: 'email-thread:permission-1',
      scopes: ['PUBLIC_CASE_STUDY'],
      revokedAt: '2026-09-14T13:00:00.000Z',
    });
  });
});
