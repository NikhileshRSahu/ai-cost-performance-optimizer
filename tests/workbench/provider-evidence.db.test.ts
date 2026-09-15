import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createDatabase } from '../../src/persistence/database.js';
import {
  organizations,
  providerEvidenceSnapshots,
} from '../../src/persistence/schema.js';
import type { AuthenticatedSession } from '../../src/workbench/authz.js';
import { persistProviderEvidenceSnapshot } from '../../src/workbench/provider-evidence-service.js';

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined) {
  throw new Error('DATABASE_URL_REQUIRED_FOR_DB_TESTS');
}

const database = createDatabase(databaseUrl);
const owner: AuthenticatedSession = {
  userId: 'owner',
  memberships: [{ organizationId: 'org-a', role: 'OWNER' }],
};

describe('provider evidence persistence', () => {
  beforeAll(async () => {
    await database.migrate();
  });

  beforeEach(async () => {
    await database.db.delete(providerEvidenceSnapshots);
    await database.db.delete(organizations);
    await database.db.insert(organizations).values({
      id: 'org-a',
      name: 'Org A',
      reportingCurrency: 'USD',
      timezone: 'UTC',
      materialityTarget: '10',
      isDemo: false,
    });
  });

  afterAll(async () => {
    await database.close();
  });

  it('persists provider usage and cost evidence separately without credentials', async () => {
    const result = await persistProviderEvidenceSnapshot({
      db: database.db,
      session: owner,
      organizationId: 'org-a',
      source: 'OPENAI_ADMIN_API',
      intervalStart: '2026-09-01T00:00:00.000Z',
      intervalEnd: '2026-09-08T00:00:00.000Z',
      receivedAt: '2026-09-15T08:30:00.000Z',
      usageEvidence: [
        {
          intervalStart: '2026-09-01T00:00:00.000Z',
          intervalEnd: '2026-09-02T00:00:00.000Z',
          model: 'model-a',
          requests: '100',
          inputTokens: '10000',
          outputTokens: '2000',
          inputCachedTokens: '1000',
          projectId: 'project-1',
          userId: null,
          apiKeyId: 'key-1',
          batch: null,
          serviceTier: null,
        },
      ],
      costEvidence: [
        {
          intervalStart: '2026-09-01T00:00:00.000Z',
          intervalEnd: '2026-09-02T00:00:00.000Z',
          amount: '12.34',
          currency: 'USD',
          projectId: 'project-1',
          lineItem: 'inference',
        },
      ],
      isDemo: false,
    });

    expect(result.reused).toBe(false);

    const rows = await database.db.select().from(providerEvidenceSnapshots);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      organizationId: 'org-a',
      source: 'OPENAI_ADMIN_API',
    });
    expect(rows[0]?.usageEvidence).toHaveLength(1);
    expect(rows[0]?.costEvidence).toHaveLength(1);

    const serialized = JSON.stringify(rows[0]);
    expect(serialized).not.toContain('sk-admin');
    expect(serialized).not.toContain('adminKey');
  });

  it('is idempotent for the exact same evidence snapshot', async () => {
    const input = {
      db: database.db,
      session: owner,
      organizationId: 'org-a',
      source: 'OPENAI_ADMIN_API' as const,
      intervalStart: '2026-09-01T00:00:00.000Z',
      intervalEnd: '2026-09-08T00:00:00.000Z',
      receivedAt: '2026-09-15T08:30:00.000Z',
      usageEvidence: [],
      costEvidence: [],
      isDemo: false,
    };

    const first = await persistProviderEvidenceSnapshot(input);
    const second = await persistProviderEvidenceSnapshot({
      ...input,
      receivedAt: '2026-09-15T08:31:00.000Z',
    });

    expect(second.snapshotId).toBe(first.snapshotId);
    expect(second.reused).toBe(true);
    expect(await database.db.select().from(providerEvidenceSnapshots)).toHaveLength(
      1,
    );
  });
});
