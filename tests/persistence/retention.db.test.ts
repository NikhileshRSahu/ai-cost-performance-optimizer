import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createDatabase } from '../../src/persistence/database.js';
import {
  importRuns,
  jobs,
  memberships,
  organizations,
  recommendations,
  usageRecords,
  users,
} from '../../src/persistence/schema.js';
import type { AuthenticatedSession } from '../../src/workbench/authz.js';
import {
  enforceRetention,
  previewRetention,
  setRetentionPolicy,
} from '../../src/workbench/retention-service.js';

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined) {
  throw new Error('DATABASE_URL_REQUIRED_FOR_DB_TESTS');
}

const database = createDatabase(databaseUrl);
const owner: AuthenticatedSession = {
  userId: 'retention-owner',
  memberships: [{ organizationId: 'retention-org', role: 'OWNER' }],
};

async function seedRawEvidence(): Promise<void> {
  await database.db.insert(importRuns).values([
    {
      id: 'old-import',
      organizationId: 'retention-org',
      source: 'CSV',
      checksum: 'old-checksum',
      status: 'COMPLETED',
      receivedAt: '2026-01-01T00:00:00Z',
      acceptedRows: 1,
      skippedRows: 0,
      rejectedRows: 0,
      warningCount: 0,
      safeErrorCategory: null,
      isDemo: false,
    },
    {
      id: 'new-import',
      organizationId: 'retention-org',
      source: 'CSV',
      checksum: 'new-checksum',
      status: 'COMPLETED',
      receivedAt: '2026-09-01T00:00:00Z',
      acceptedRows: 1,
      skippedRows: 0,
      rejectedRows: 0,
      warningCount: 0,
      safeErrorCategory: null,
      isDemo: false,
    },
  ]);

  await database.db.insert(usageRecords).values([
    {
      id: 'old-usage',
      organizationId: 'retention-org',
      importRunId: 'old-import',
      source: 'CSV',
      sourceEventId: null,
      fingerprint: 'old-fingerprint',
      workloadId: null,
      provider: 'openai',
      model: 'model-a',
      granularity: 'REQUEST',
      intervalStart: '2026-01-01T00:00:00Z',
      intervalEnd: '2026-01-01T00:01:00Z',
      requests: '1',
      totalCost: '1.00',
      currency: 'USD',
      canonical: { evidence: 'old' },
      isDemo: false,
    },
    {
      id: 'new-usage',
      organizationId: 'retention-org',
      importRunId: 'new-import',
      source: 'CSV',
      sourceEventId: null,
      fingerprint: 'new-fingerprint',
      workloadId: null,
      provider: 'openai',
      model: 'model-a',
      granularity: 'REQUEST',
      intervalStart: '2026-09-01T00:00:00Z',
      intervalEnd: '2026-09-01T00:01:00Z',
      requests: '1',
      totalCost: '1.00',
      currency: 'USD',
      canonical: { evidence: 'new' },
      isDemo: false,
    },
  ]);

  await database.db.insert(jobs).values([
    {
      id: 'old-job',
      organizationId: 'retention-org',
      kind: 'IMPORT',
      status: 'SUCCEEDED',
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'new-job',
      organizationId: 'retention-org',
      kind: 'IMPORT',
      status: 'SUCCEEDED',
      createdAt: '2026-09-01T00:00:00Z',
    },
  ]);

  await database.db.insert(recommendations).values({
    id: 'old-decision',
    organizationId: 'retention-org',
    workloadId: null,
    decision: 'OPTIMIZE',
    savingState: 'TESTED',
    evidence: { retained: true },
    isDemo: false,
    createdAt: '2026-01-01T00:00:00Z',
  });
}

describe('raw-evidence retention', () => {
  beforeAll(async () => {
    await database.migrate();
  });

  beforeEach(async () => {
    await database.db.delete(memberships);
    await database.db.delete(users);
    await database.db.delete(organizations);

    await database.db.insert(organizations).values({
      id: 'retention-org',
      name: 'Retention Org',
      reportingCurrency: 'USD',
      timezone: 'UTC',
      materialityTarget: '100',
    });
    await database.db.insert(users).values({
      id: 'retention-owner',
      email: 'retention@example.test',
      authProvider: 'test',
      authSubject: 'retention-owner',
    });
    await database.db.insert(memberships).values({
      organizationId: 'retention-org',
      userId: 'retention-owner',
      role: 'OWNER',
    });
    await seedRawEvidence();
  });

  afterAll(async () => {
    await database.close();
  });

  it('previews and deletes only raw evidence older than the configured cutoff', async () => {
    await setRetentionPolicy({
      db: database.db,
      session: owner,
      organizationId: 'retention-org',
      retentionDays: 90,
    });

    const preview = await previewRetention({
      db: database.db,
      session: owner,
      organizationId: 'retention-org',
      now: '2026-09-14T00:00:00Z',
    });
    expect(preview).toMatchObject({
      enabled: true,
      retentionDays: 90,
      usageRecords: 1,
      importRuns: 1,
      jobs: 1,
      totalRawEvidenceRows: 3,
    });

    const result = await enforceRetention({
      db: database.db,
      session: owner,
      organizationId: 'retention-org',
      now: '2026-09-14T00:00:00Z',
    });
    expect(result).toMatchObject({
      deletedUsageRecords: 1,
      deletedImportRuns: 1,
      deletedJobs: 1,
    });

    const remainingUsage = await database.db.select().from(usageRecords);
    const remainingImports = await database.db.select().from(importRuns);
    const remainingJobs = await database.db.select().from(jobs);
    const retainedDecisions = await database.db.select().from(recommendations);

    expect(remainingUsage.map((row) => row.id)).toEqual(['new-usage']);
    expect(remainingImports.map((row) => row.id)).toEqual(['new-import']);
    expect(remainingJobs.map((row) => row.id)).toEqual(['new-job']);
    expect(retainedDecisions.map((row) => row.id)).toEqual(['old-decision']);
  });

  it('lets only owners configure retention', async () => {
    const operator: AuthenticatedSession = {
      userId: 'operator',
      memberships: [{ organizationId: 'retention-org', role: 'OPERATOR' }],
    };

    await expect(
      setRetentionPolicy({
        db: database.db,
        session: operator,
        organizationId: 'retention-org',
        retentionDays: 90,
      }),
    ).rejects.toThrow('ACTION_NOT_ALLOWED');
  });
});
