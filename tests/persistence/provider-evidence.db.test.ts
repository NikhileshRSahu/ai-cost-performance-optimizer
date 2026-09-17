import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createDatabase } from '../../src/persistence/database.js';
import { providerEvidenceSnapshots } from '../../src/persistence/provider-evidence-schema.js';
import { organizations } from '../../src/persistence/schema.js';
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

  it('stores normalized usage and cost evidence separately and idempotently', async () => {
    const input = {
      db: database.db,
      session: owner,
      organizationId: 'org-a',
      source: 'OPENAI_ADMIN_API' as const,
      intervalStart: '2026-09-01T00:00:00.000Z',
      intervalEnd: '2026-09-08T00:00:00.000Z',
      receivedAt: '2026-09-08T00:00:00.000Z',
      evidence: {
        usage: [
          {
            source: 'OPENAI_ADMIN_API' as const,
            provider: 'openai' as const,
            organizationId: 'org-a',
            intervalStart: '2026-09-01T00:00:00.000Z',
            intervalEnd: '2026-09-02T00:00:00.000Z',
            requests: '5',
            inputTokens: '1000',
            uncachedInputTokens: null,
            cachedInputTokens: '400',
            cacheWriteTokens: '0',
            outputTokens: '200',
            model: 'gpt-test',
            projectId: 'project-1',
            workspaceId: null,
            apiKeyId: null,
            serviceTier: null,
            fingerprint: 'usage-fingerprint',
          },
        ],
        costs: [
          {
            source: 'OPENAI_ADMIN_API' as const,
            provider: 'openai' as const,
            organizationId: 'org-a',
            intervalStart: '2026-09-01T00:00:00.000Z',
            intervalEnd: '2026-09-02T00:00:00.000Z',
            amount: '1.25',
            amountUnit: 'MAJOR' as const,
            currency: 'USD',
            projectId: 'project-1',
            workspaceId: null,
            model: null,
            description: 'Model usage',
            serviceTier: null,
            tokenType: null,
            coverageLimitation: null,
            fingerprint: 'cost-fingerprint',
          },
        ],
      },
    };

    const first = await persistProviderEvidenceSnapshot(input);
    const second = await persistProviderEvidenceSnapshot(input);

    expect(first.reused).toBe(false);
    expect(second).toEqual({ snapshotId: first.snapshotId, reused: true });

    const rows = await database.db.select().from(providerEvidenceSnapshots);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.usageEvidence).toHaveLength(1);
    expect(rows[0]?.costEvidence).toHaveLength(1);
    expect(JSON.stringify(rows[0])).not.toContain('sk-admin');
  });
});
