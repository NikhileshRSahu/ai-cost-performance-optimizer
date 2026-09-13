import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { LedgerEvent } from '../../src/ledger/ledger.js';
import { createDatabase } from '../../src/persistence/database.js';
import {
  createEvidenceRepository,
  createImportRepository,
  createJobRepository,
  createMembershipRepository,
  createOrganizationRepository,
} from '../../src/persistence/repositories/index.js';
import {
  importRuns,
  jobs,
  ledgerEvents,
  memberships,
  organizations,
  recommendations,
  users,
} from '../../src/persistence/schema.js';
import type { AuthenticatedSession } from '../../src/workbench/authz.js';

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined) {
  throw new Error('DATABASE_URL_REQUIRED_FOR_DB_TESTS');
}

const database = createDatabase(databaseUrl);
const organizationsRepository = createOrganizationRepository(database.db);
const membershipRepository = createMembershipRepository(database.db);
const imports = createImportRepository(database.db);
const evidence = createEvidenceRepository(database.db);
const jobRepository = createJobRepository(database.db);

const sessionA: AuthenticatedSession = {
  userId: 'user-a',
  memberships: [{ organizationId: 'org-a', role: 'OWNER' }],
};

describe('persistence tenant security boundary', () => {
  beforeAll(async () => {
    await database.migrate();
  });

  beforeEach(async () => {
    await database.db.delete(jobs);
    await database.db.delete(importRuns);
    await database.db.delete(ledgerEvents);
    await database.db.delete(recommendations);
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
        authSubject: 'a',
      },
      {
        id: 'user-b',
        email: 'b@example.test',
        authProvider: 'test',
        authSubject: 'b',
      },
    ]);
    await database.db.insert(memberships).values([
      { organizationId: 'org-a', userId: 'user-a', role: 'OWNER' },
      { organizationId: 'org-b', userId: 'user-b', role: 'OWNER' },
    ]);
    await database.db.insert(recommendations).values({
      id: 'rec-shared',
      organizationId: 'org-b',
      decision: 'BENCHMARK',
      savingState: 'OPPORTUNITY',
      evidence: {},
    });
  });

  afterAll(async () => {
    await database.close();
  });

  it('rejects reads and mutations across all exposed tenant repositories', async () => {
    await expect(
      organizationsRepository.get(sessionA, 'org-b'),
    ).rejects.toThrow('ORGANIZATION_MEMBERSHIP_REQUIRED');

    await expect(
      membershipRepository.listForOrganization(sessionA, 'org-b'),
    ).rejects.toThrow('ORGANIZATION_MEMBERSHIP_REQUIRED');

    await expect(
      imports.create(sessionA, {
        id: 'import-b',
        organizationId: 'org-b',
        source: 'csv',
        checksum: 'sha256:b',
        status: 'COMPLETED',
        safeErrorCategory: null,
      }),
    ).rejects.toThrow('ORGANIZATION_MEMBERSHIP_REQUIRED');

    const event: LedgerEvent = {
      id: 'ledger-b',
      organizationId: 'org-b',
      recommendationId: 'rec-shared',
      type: 'STATE_RECORDED',
      state: 'OPPORTUNITY',
      occurredAt: '2026-09-13T00:00:00Z',
      evidenceRef: 'evidence-b',
      reason: null,
      invalidatesEventId: null,
    };
    await expect(evidence.appendLedgerEvent(sessionA, event)).rejects.toThrow(
      'ORGANIZATION_MEMBERSHIP_REQUIRED',
    );

    await expect(
      jobRepository.create(sessionA, {
        id: 'job-b',
        organizationId: 'org-b',
        kind: 'IMPORT',
      }),
    ).rejects.toThrow('ORGANIZATION_MEMBERSHIP_REQUIRED');
  });

  it('rejects unrestricted error text before persistence', async () => {
    await jobRepository.create(sessionA, {
      id: 'job-a',
      organizationId: 'org-a',
      kind: 'BENCHMARK',
    });

    for (const unsafe of [
      'Authorization: Bearer abc123',
      'request body={"prompt":"private"}',
      'provider error: token=secret',
    ]) {
      await expect(
        jobRepository.markFailed(sessionA, 'org-a', 'job-a', unsafe),
      ).rejects.toThrow('UNSAFE_ERROR_CATEGORY');
    }
  });
});
