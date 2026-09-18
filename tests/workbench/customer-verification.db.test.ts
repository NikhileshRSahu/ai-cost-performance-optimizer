import { readFile } from 'node:fs/promises';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createDatabase } from '../../src/persistence/database.js';
import {
  implementationRecords,
  importRuns,
  ledgerEvents,
  organizations,
  recommendations,
  usageRecords,
  verificationWindows,
  workloads,
} from '../../src/persistence/schema.js';
import { evaluateAndPersistBenchmark } from '../../src/workbench/benchmark-service.js';
import { confirmImplementation } from '../../src/workbench/implementation-service.js';
import { importCustomerUsage } from '../../src/workbench/import-service.js';
import { verifyCustomerChange } from '../../src/workbench/verification-service.js';
import { saveWorkloadConstraints } from '../../src/workbench/workload-service.js';
import type { AuthenticatedSession } from '../../src/workbench/authz.js';

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined) {
  throw new Error('DATABASE_URL_REQUIRED_FOR_DB_TESTS');
}

const database = createDatabase(databaseUrl);
const session: AuthenticatedSession = {
  userId: 'owner-user',
  memberships: [{ organizationId: 'journey-org', role: 'OWNER' }],
};

async function fixture(name: string): Promise<Uint8Array> {
  return new Uint8Array(
    await readFile(new URL(`../../fixtures/demo/${name}`, import.meta.url)),
  );
}

async function prepareTestedRecommendation() {
  const baseline = await importCustomerUsage({
    db: database.db,
    session,
    organizationId: 'journey-org',
    fileName: 'customer-loop-tough.csv',
    bytes: await fixture('customer-loop-tough.csv'),
    isDemo: true,
    receivedAt: '2026-08-29T01:00:00Z',
  });
  expect(baseline.accepted).toBe(28);
  expect(baseline.rejected).toBe(5);

  const workload = await saveWorkloadConstraints({
    db: database.db,
    session,
    organizationId: 'journey-org',
    values: {
      name: 'classification',
      environment: 'production',
      requiredQuality: '0.90',
      maxP95LatencyMs: '1000',
      maxFailureRate: '0.05',
    },
  });

  const benchmark = await evaluateAndPersistBenchmark({
    db: database.db,
    session,
    organizationId: 'journey-org',
    workloadId: workload.id,
    bytes: await fixture('customer-loop-benchmark.csv'),
    currentConfigurationId: 'model-a',
    candidateConfigurationId: 'model-b',
    evaluatorVersion: 'eval-v1',
    currency: 'USD',
    isDemo: true,
  });

  expect(benchmark).toMatchObject({
    decision: 'OPTIMIZE',
    savingState: 'TESTED',
  });

  await confirmImplementation({
    db: database.db,
    session,
    organizationId: 'journey-org',
    recommendationId: benchmark.recommendationId,
    implementedAt: '2026-08-30T08:00:00Z',
    rolloutStart: '2026-08-30T08:00:00Z',
    stabilizationEnd: '2026-09-01T08:00:00Z',
    deploymentNote: '10% canary expanded after stable benchmark metrics.',
    rollbackInstructions: ['Restore model-a configuration.'],
  });

  return benchmark.recommendationId;
}

describe('complete customer verification loop', () => {
  beforeAll(async () => {
    await database.migrate();
  });

  beforeEach(async () => {
    await database.db.delete(verificationWindows);
    await database.db.delete(implementationRecords);
    await database.db.delete(ledgerEvents);
    await database.db.delete(recommendations);
    await database.db.delete(workloads);
    await database.db.delete(usageRecords);
    await database.db.delete(importRuns);
    await database.db.delete(organizations);
    await database.db.insert(organizations).values({
      id: 'journey-org',
      name: 'Journey Demo Co',
      reportingCurrency: 'USD',
      timezone: 'UTC',
      materialityTarget: '10',
      isDemo: true,
    });
  });

  afterAll(async () => {
    await database.close();
  });

  it('advances TESTED to VERIFIED only after comparable post-change evidence', async () => {
    const recommendationId = await prepareTestedRecommendation();

    const outcome = await verifyCustomerChange({
      db: database.db,
      session,
      organizationId: 'journey-org',
      recommendationId,
      postFileName: 'customer-loop-post-change.csv',
      postBytes: await fixture('customer-loop-post-change.csv'),
      receivedAt: '2026-09-10T09:00:00Z',
      measuredQuality: '0.93',
      postP95LatencyMs: '844',
      postFailureRate: '0.018',
      qualitySourceRef: 'eval-suite:classification-v3',
      implementationCost: '0',
      incrementalOperatingCost: '0',
      attestations: {
        unitDefinitionUnchanged: true,
        workloadMixComparable: true,
        concurrentDeploymentsResolved: true,
      },
    });

    expect(outcome.result.status).toBe('VERIFIED');
    expect(outcome.result.direction).toBe('SAVING');
    expect(BigInt(outcome.result.netImpact?.numerator ?? '0')).toBeGreaterThan(
      0n,
    );

    const [recommendation] = await database.db.select().from(recommendations);
    expect(recommendation?.savingState).toBe('VERIFIED');
    const verificationRows = await database.db
      .select()
      .from(verificationWindows);
    expect(verificationRows).toHaveLength(1);
    expect(verificationRows[0]?.evidence).toMatchObject({
      denominator: 'SUCCESSFUL_OUTCOMES',
      unitDefinition: 'successful-outcome-v1',
      successDefinition: 'csv-successes-v1',
    });
  });

  it('keeps the recommendation TESTED when post-change quality fails', async () => {
    const recommendationId = await prepareTestedRecommendation();

    const outcome = await verifyCustomerChange({
      db: database.db,
      session,
      organizationId: 'journey-org',
      recommendationId,
      postFileName: 'customer-loop-post-change.csv',
      postBytes: await fixture('customer-loop-post-change.csv'),
      receivedAt: '2026-09-10T09:00:00Z',
      measuredQuality: '0.80',
      postP95LatencyMs: '844',
      postFailureRate: '0.018',
      qualitySourceRef: 'eval-suite:classification-v3',
      implementationCost: '0',
      incrementalOperatingCost: '0',
      attestations: {
        unitDefinitionUnchanged: true,
        workloadMixComparable: true,
        concurrentDeploymentsResolved: true,
      },
    });

    expect(outcome.result.status).toBe('BLOCKED');
    expect(outcome.result.reasons).toContain('PERFORMANCE_CONSTRAINT_FAILED');

    const [recommendation] = await database.db.select().from(recommendations);
    expect(recommendation?.savingState).toBe('TESTED');
  });
});
