import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { OpenAIAdminFetch } from '../../src/ingestion/connectors/openai-admin.js';
import { createDatabase } from '../../src/persistence/database.js';
import {
  organizations,
  providerEvidenceSnapshots,
} from '../../src/persistence/schema.js';
import type { AuthenticatedSession } from '../../src/workbench/authz.js';
import { syncOpenAIAdminEvidence } from '../../src/workbench/openai-admin-sync-service.js';

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined) {
  throw new Error('DATABASE_URL_REQUIRED_FOR_DB_TESTS');
}

const database = createDatabase(databaseUrl);
const owner: AuthenticatedSession = {
  userId: 'owner',
  memberships: [{ organizationId: 'org-a', role: 'OWNER' }],
};

describe('OpenAI Admin evidence sync', () => {
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

  it('fetches with the transient key and persists only provider evidence', async () => {
    const fetcher: OpenAIAdminFetch = (url, init) => {
      expect(init.headers.Authorization).toBe('Bearer secret-admin-key');

      if (url.includes('/organization/usage/completions')) {
        return {
          ok: true,
          status: 200,
          json: () => ({
            object: 'page',
            data: [
              {
                object: 'bucket',
                start_time: 1_725_148_800,
                end_time: 1_725_235_200,
                results: [
                  {
                    object: 'organization.usage.completions.result',
                    input_tokens: 1000,
                    output_tokens: 200,
                    input_cached_tokens: 400,
                    num_model_requests: 5,
                    project_id: 'proj_1',
                    user_id: null,
                    api_key_id: 'key_1',
                    model: 'gpt-test-1',
                    batch: false,
                    service_tier: null,
                  },
                ],
              },
            ],
            has_more: false,
            next_page: null,
          }),
        };
      }

      return {
        ok: true,
        status: 200,
        json: () => ({
          object: 'page',
          data: [
            {
              object: 'bucket',
              start_time: 1_725_148_800,
              end_time: 1_725_235_200,
              results: [
                {
                  object: 'organization.costs.result',
                  amount: { value: 1.25, currency: 'usd' },
                  line_item: 'Model usage',
                  project_id: 'proj_1',
                },
              ],
            },
          ],
          has_more: false,
          next_page: null,
        }),
      };
    };

    const result = await syncOpenAIAdminEvidence({
      db: database.db,
      session: owner,
      organizationId: 'org-a',
      adminKey: 'secret-admin-key',
      startTime: 1_725_148_800,
      endTime: 1_725_235_200,
      receivedAt: '2026-09-15T08:35:00.000Z',
      fetcher,
    });

    expect(result.reused).toBe(false);
    expect(result.usageRows).toBe(1);
    expect(result.costRows).toBe(1);

    const [stored] = await database.db.select().from(providerEvidenceSnapshots);
    expect(stored?.source).toBe('OPENAI_ADMIN_API');
    expect(JSON.stringify(stored)).not.toContain('secret-admin-key');
    expect(stored?.usageEvidence).toHaveLength(1);
    expect(stored?.costEvidence).toHaveLength(1);
  });
});
