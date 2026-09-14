import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { productionTelemetryBatchSchema } from '../../src/efficiency/telemetry-contracts.js';
import { createDatabase } from '../../src/persistence/database.js';
import {
  importRuns,
  memberships,
  organizations,
  usageRecords,
  users,
} from '../../src/persistence/schema.js';
import type { AuthenticatedSession } from '../../src/workbench/authz.js';
import { ingestProductionTelemetry } from '../../src/workbench/telemetry-service.js';

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined) {
  throw new Error('DATABASE_URL_REQUIRED_FOR_DB_TESTS');
}

const database = createDatabase(databaseUrl);
const session: AuthenticatedSession = {
  userId: 'telemetry-owner',
  memberships: [{ organizationId: 'telemetry-org', role: 'OWNER' }],
};

function event(eventId: string, cost: string) {
  return {
    schemaVersion: 'production-telemetry-v1',
    eventId,
    occurredAt: '2026-09-14T05:00:00Z',
    provider: 'openai',
    model: 'model-a',
    workload: 'classification',
    configurationId: 'cfg-a',
    operationId: 'op-a',
    attemptNumber: '1',
    retryCount: '0',
    outcome: 'SUCCESS',
    totalCost: cost,
    currency: 'USD',
    latencyMs: '420',
    inputTokens: '1200',
    cachedInputTokens: '200',
    cacheWriteTokens: '0',
    outputTokens: '80',
    outputCost: '0.02',
    toolCalls: '0',
    toolCost: '0',
    stablePrefixHash: null,
    stablePrefixTokens: null,
    cacheEligibleInputTokens: '500',
    outcomeValue: '1',
    outcomeUnit: 'resolved',
    tags: {},
  } as const;
}

function batch(events: readonly ReturnType<typeof event>[]) {
  return productionTelemetryBatchSchema.parse({
    schemaVersion: 'production-telemetry-batch-v1',
    events,
  });
}

describe('production telemetry persistence', () => {
  beforeAll(async () => {
    await database.migrate();
  });

  beforeEach(async () => {
    await database.db.delete(memberships);
    await database.db.delete(users);
    await database.db.delete(organizations);

    await database.db.insert(organizations).values({
      id: 'telemetry-org',
      name: 'Telemetry Org',
      reportingCurrency: 'USD',
      timezone: 'UTC',
      materialityTarget: '100',
    });
    await database.db.insert(users).values({
      id: 'telemetry-owner',
      email: 'telemetry@example.test',
      authProvider: 'test',
      authSubject: 'telemetry-owner',
    });
    await database.db.insert(memberships).values({
      organizationId: 'telemetry-org',
      userId: 'telemetry-owner',
      role: 'OWNER',
    });
  });

  afterAll(async () => {
    await database.close();
  });

  it('reuses an identical telemetry batch without double counting', async () => {
    const input = batch([event('evt-1', '0.12')]);

    const first = await ingestProductionTelemetry({
      db: database.db,
      session,
      organizationId: 'telemetry-org',
      batch: input,
      receivedAt: '2026-09-14T05:01:00Z',
      isDemo: false,
    });
    const second = await ingestProductionTelemetry({
      db: database.db,
      session,
      organizationId: 'telemetry-org',
      batch: input,
      receivedAt: '2026-09-14T05:02:00Z',
      isDemo: false,
    });

    expect(first).toMatchObject({
      accepted: 1,
      skippedDuplicates: 0,
      reusedBatch: false,
    });
    expect(second).toMatchObject({
      importId: first.importId,
      accepted: 1,
      skippedDuplicates: 0,
      reusedBatch: true,
    });

    const records = await database.db
      .select()
      .from(usageRecords);
    expect(records).toHaveLength(1);
    expect(records[0]?.source).toBe('PRODUCTION_TELEMETRY');
  });

  it('skips an old event when a later batch overlaps with new evidence', async () => {
    await ingestProductionTelemetry({
      db: database.db,
      session,
      organizationId: 'telemetry-org',
      batch: batch([event('evt-1', '0.12')]),
      receivedAt: '2026-09-14T05:01:00Z',
      isDemo: false,
    });

    const second = await ingestProductionTelemetry({
      db: database.db,
      session,
      organizationId: 'telemetry-org',
      batch: batch([event('evt-1', '0.12'), event('evt-2', '0.08')]),
      receivedAt: '2026-09-14T05:02:00Z',
      isDemo: false,
    });

    expect(second).toMatchObject({
      accepted: 1,
      skippedDuplicates: 1,
      reusedBatch: false,
    });

    const records = await database.db.select().from(usageRecords);
    expect(records.map((row) => row.sourceEventId).sort()).toEqual([
      'evt-1',
      'evt-2',
    ]);

    const imports = await database.db.select().from(importRuns);
    expect(imports).toHaveLength(2);
  });

  it('rejects telemetry ingestion for a viewer', async () => {
    const viewer: AuthenticatedSession = {
      userId: 'viewer',
      memberships: [{ organizationId: 'telemetry-org', role: 'VIEWER' }],
    };

    await expect(
      ingestProductionTelemetry({
        db: database.db,
        session: viewer,
        organizationId: 'telemetry-org',
        batch: batch([event('evt-1', '0.12')]),
        receivedAt: '2026-09-14T05:01:00Z',
        isDemo: false,
      }),
    ).rejects.toThrow('ACTION_NOT_ALLOWED');
  });
});
