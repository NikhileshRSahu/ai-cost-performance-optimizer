import { readFile } from 'node:fs/promises';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadFounderDashboardEvidence } from '../lib/dashboard-data';
import { createDatabase } from '../../../src/persistence/database.js';
import { providerConnections } from '../../../src/persistence/provider-connections-schema.js';
import { providerEvidenceSnapshots } from '../../../src/persistence/provider-evidence-schema.js';
import {
  importRuns,
  ledgerEvents,
  organizations,
  recommendations,
  usageRecords,
} from '../../../src/persistence/schema.js';
import { analyzeImportedUsage } from '../../../src/workbench/analysis-service.js';
import type { AuthenticatedSession } from '../../../src/workbench/authz.js';
import { importCustomerUsage } from '../../../src/workbench/import-service.js';

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined) {
  throw new Error('DATABASE_URL_REQUIRED_FOR_DB_TESTS');
}

const database = createDatabase(databaseUrl);
const session: AuthenticatedSession = {
  userId: 'owner',
  memberships: [{ organizationId: 'context-org', role: 'OWNER' }],
};

async function demoFixture(): Promise<Uint8Array> {
  return new Uint8Array(
    await readFile(
      new URL(
        '../../../fixtures/demo/customer-loop-tough.csv',
        import.meta.url,
      ),
    ),
  );
}

describe('dashboard analysis context selection', () => {
  beforeAll(async () => {
    await database.migrate();
  });

  beforeEach(async () => {
    await database.db.delete(providerEvidenceSnapshots);
    await database.db.delete(providerConnections);
    await database.db.delete(ledgerEvents);
    await database.db.delete(recommendations);
    await database.db.delete(usageRecords);
    await database.db.delete(importRuns);
    await database.db.delete(organizations);

    await database.db.insert(organizations).values({
      id: 'context-org',
      name: 'Context Org',
      reportingCurrency: 'USD',
      timezone: 'UTC',
      materialityTarget: '10',
      isDemo: false,
    });
  });

  afterAll(async () => {
    await database.close();
  });

  it('keeps an explicitly selected demo import authoritative over newer provider evidence', async () => {
    const imported = await importCustomerUsage({
      db: database.db,
      session,
      organizationId: 'context-org',
      fileName: 'demo.csv',
      bytes: await demoFixture(),
      isDemo: true,
      receivedAt: '2026-09-18T08:00:00Z',
    });
    await analyzeImportedUsage({
      db: database.db,
      session,
      organizationId: 'context-org',
      importId: imported.importId,
    });

    await database.db.insert(providerConnections).values({
      organizationId: 'context-org',
      provider: 'OPENAI',
      credentialCiphertext: 'v1:test:test:test',
      connectedAt: '2026-09-18T09:00:00Z',
      lastSyncAt: '2026-09-18T09:00:00Z',
      lastSyncStatus: 'READY',
      safeErrorCategory: null,
      revokedAt: null,
      createdByUserId: 'owner',
      updatedAt: '2026-09-18T09:00:00Z',
    });
    await database.db.insert(providerEvidenceSnapshots).values({
      id: 'provider-zero-later',
      organizationId: 'context-org',
      source: 'OPENAI_ADMIN_API',
      checksum: 'provider-zero-later',
      intervalStart: '2026-09-11T09:00:00Z',
      intervalEnd: '2026-09-18T09:00:00Z',
      receivedAt: '2026-09-18T09:00:00Z',
      usageEvidence: [],
      costEvidence: [],
      isDemo: false,
    });

    const explicitDemo = await loadFounderDashboardEvidence(
      database.db,
      session,
      'context-org',
      { source: 'DEMO', importId: imported.importId },
    );
    expect(explicitDemo.sourceKind).toBe('DEMO');
    expect(explicitDemo.isDemo).toBe(true);
    expect(explicitDemo.dataQuality).not.toBe('ZERO_USAGE');
    expect(explicitDemo.observedSpend).not.toBeNull();
    expect(
      explicitDemo.recommendations.every(
        (recommendation) => recommendation.recommendationId.length > 0,
      ),
    ).toBe(true);

    const automatic = await loadFounderDashboardEvidence(
      database.db,
      session,
      'context-org',
      { source: 'AUTO' },
    );
    expect(automatic.sourceKind).toBe('PROVIDER');
    expect(automatic.providerName).toBe('OpenAI');
    expect(automatic.dataQuality).toBe('ZERO_USAGE');
  });
});
