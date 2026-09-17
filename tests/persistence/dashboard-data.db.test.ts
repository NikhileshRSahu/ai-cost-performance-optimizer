import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createDatabase } from '../../src/persistence/database.js';
import type { PersistenceDatabase } from '../../src/persistence/database.js';
import { providerEvidenceSnapshots } from '../../src/persistence/provider-evidence-schema.js';
import {
  importRuns,
  organizations,
  recommendations,
  usageRecords,
  verificationWindows,
} from '../../src/persistence/schema.js';
import type { AuthenticatedSession } from '../../src/workbench/authz.js';
import type { DashboardEvidence } from '../../src/workbench/dashboard-view.js';

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined) {
  throw new Error('DATABASE_URL_REQUIRED_FOR_DB_TESTS');
}

const database = createDatabase(databaseUrl);
const owner: AuthenticatedSession = {
  userId: 'owner',
  memberships: [{ organizationId: 'org-a', role: 'OWNER' }],
};

type DashboardLoader = (
  db: PersistenceDatabase,
  session: AuthenticatedSession,
  organizationId: string,
) => Promise<DashboardEvidence>;

async function loadDashboard(
  db: PersistenceDatabase,
  session: AuthenticatedSession,
  organizationId: string,
): Promise<DashboardEvidence> {
  const moduleUrl = new URL(
    '../../apps/web/lib/dashboard-data.ts',
    import.meta.url,
  ).href;
  const dashboardModule = (await import(moduleUrl)) as Readonly<{
    loadFounderDashboardEvidence: DashboardLoader;
  }>;
  return dashboardModule.loadFounderDashboardEvidence(
    db,
    session,
    organizationId,
  );
}

function canonicalRecord(importId: string) {
  return {
    organizationId: 'org-a',
    source: 'CSV' as const,
    granularity: 'AGGREGATE_BUCKET' as const,
    intervalStart: '2026-09-10T00:00:00.000Z',
    intervalEnd: '2026-09-11T00:00:00.000Z',
    provider: 'openai',
    model: 'gpt-test',
    requests: '10',
    totalCost: '5.00',
    currency: 'USD',
    sourceEventId: null,
    project: null,
    workspace: null,
    workload: null,
    configurationId: null,
    operationId: null,
    attemptNumber: null,
    retryCount: null,
    inputTokens: '1000',
    cachedInputTokens: '100',
    cacheWriteTokens: '0',
    outputTokens: '200',
    outputCost: null,
    toolCalls: null,
    toolCost: null,
    successes: null,
    failures: null,
    latencyP50Ms: null,
    latencyP95Ms: null,
    stablePrefixHash: null,
    stablePrefixTokens: null,
    cacheEligibleInputTokens: null,
    sourceLine: 1,
    fingerprint: importId === 'import-new' ? 'a'.repeat(64) : 'b'.repeat(64),
    isDemo: false,
  };
}

describe('founder dashboard data loading', () => {
  beforeAll(async () => {
    await database.migrate();
  });

  beforeEach(async () => {
    await database.db.delete(verificationWindows);
    await database.db.delete(recommendations);
    await database.db.delete(usageRecords);
    await database.db.delete(providerEvidenceSnapshots);
    await database.db.delete(importRuns);
    await database.db.delete(organizations);

    await database.db.insert(organizations).values({
      id: 'org-a',
      name: 'Org A',
      reportingCurrency: 'USD',
      timezone: 'UTC',
      materialityTarget: '10',
      isDemo: false,
    });

    await database.db.insert(importRuns).values([
      {
        id: 'import-old',
        organizationId: 'org-a',
        source: 'CSV',
        checksum: 'old-checksum',
        status: 'COMPLETED',
        rangeStart: '2026-09-01T00:00:00.000Z',
        rangeEnd: '2026-09-08T00:00:00.000Z',
        receivedAt: '2026-09-08T01:00:00.000Z',
        acceptedRows: 1,
      },
      {
        id: 'import-new',
        organizationId: 'org-a',
        source: 'CSV',
        checksum: 'new-checksum',
        status: 'COMPLETED',
        rangeStart: '2026-09-10T00:00:00.000Z',
        rangeEnd: '2026-09-17T00:00:00.000Z',
        receivedAt: '2026-09-17T01:00:00.000Z',
        acceptedRows: 1,
      },
    ]);

    const canonical = canonicalRecord('import-new');
    await database.db.insert(usageRecords).values({
      id: 'usage-new',
      organizationId: 'org-a',
      importRunId: 'import-new',
      source: 'CSV',
      sourceEventId: null,
      fingerprint: canonical.fingerprint,
      workloadId: null,
      provider: canonical.provider,
      model: canonical.model,
      granularity: canonical.granularity,
      intervalStart: canonical.intervalStart,
      intervalEnd: canonical.intervalEnd,
      requests: canonical.requests,
      totalCost: canonical.totalCost,
      currency: canonical.currency,
      canonical,
      isDemo: false,
    });
  });

  afterAll(async () => {
    await database.close();
  });

  it('surfaces only the latest import recommendations and returns a deterministic top three', async () => {
    await database.db.insert(recommendations).values([
      {
        id: 'stale-rank-1',
        organizationId: 'org-a',
        decision: 'INSUFFICIENT_EVIDENCE',
        savingState: 'OPPORTUNITY',
        confidenceBand: 'HIGH',
        evidence: {
          priorityRank: 1,
          title: 'Stale recommendation',
          sourceImportId: 'import-old',
          nextAction: 'Do not surface this.',
        },
      },
      ...[4, 2, 1, 3].map((priorityRank) => ({
        id: `current-rank-${String(priorityRank)}`,
        organizationId: 'org-a',
        decision: 'INSUFFICIENT_EVIDENCE',
        savingState: 'OPPORTUNITY' as const,
        confidenceBand: priorityRank === 1 ? 'HIGH' : 'MEDIUM',
        evidence: {
          priorityRank,
          title: `Current recommendation ${String(priorityRank)}`,
          sourceImportId: 'import-new',
          nextAction: `Action ${String(priorityRank)}`,
          detectionConfidence: priorityRank === 1 ? 'HIGH' : 'MEDIUM',
          savingsConfidence: 'UNMEASURED',
        },
      })),
    ]);

    const evidence = await loadDashboard(database.db, owner, 'org-a');

    expect(
      evidence.recommendations?.map((item) => item.recommendationId),
    ).toEqual(['current-rank-1', 'current-rank-2', 'current-rank-3']);
    expect(evidence.strongestAction?.recommendationId).toBe('current-rank-1');
    expect(evidence.recommendations?.[0]).toMatchObject({
      priorityRank: 1,
      detectionConfidence: 'HIGH',
      savingsConfidence: 'UNMEASURED',
    });
    expect(
      evidence.recommendations?.some(
        (item) => item.recommendationId === 'stale-rank-1',
      ),
    ).toBe(false);
  });
});
