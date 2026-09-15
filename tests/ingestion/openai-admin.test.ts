import { describe, expect, it } from 'vitest';
import {
  fetchOpenAIAdminSnapshot,
  type OpenAIAdminFetch,
} from '../../src/ingestion/connectors/openai-admin.js';

describe('OpenAI Admin connector', () => {
  it('paginates usage and cost evidence without inventing cost attribution', async () => {
    const seen: string[] = [];
    const fetcher: OpenAIAdminFetch = (url, init) => {
      seen.push(url);
      expect(init.headers.Authorization).toBe('Bearer admin-test-key');

      if (url.includes('/organization/usage/completions')) {
        if (url.includes('page=usage-next')) {
          return {
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              object: 'page',
              data: [
                {
                  object: 'bucket',
                  start_time: 1_725_235_200,
                  end_time: 1_725_321_600,
                  results: [
                    {
                      object: 'organization.usage.completions.result',
                      input_tokens: 300,
                      output_tokens: 50,
                      input_cached_tokens: 100,
                      num_model_requests: 2,
                      project_id: 'proj_1',
                      user_id: null,
                      api_key_id: null,
                      model: 'gpt-test-2',
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
          json: () => Promise.resolve({
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
            has_more: true,
            next_page: 'usage-next',
          }),
        };
      }

      if (url.includes('/organization/costs')) {
        return {
          ok: true,
          status: 200,
          json: () => Promise.resolve({
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
      }

      throw new Error(`unexpected URL: ${url}`);
    };

    const result = await fetchOpenAIAdminSnapshot({
      adminKey: 'admin-test-key',
      startTime: 1_725_148_800,
      endTime: 1_725_321_600,
      fetcher,
    });

    expect(result.usage).toHaveLength(2);
    expect(result.costs).toHaveLength(1);
    expect(result.usage[0]?.model).toBe('gpt-test-1');
    expect(result.usage[0]?.inputCachedTokens).toBe('400');
    expect(result.costs[0]).toMatchObject({
      amount: '1.25',
      currency: 'USD',
      projectId: 'proj_1',
      lineItem: 'Model usage',
    });
    expect(result.costs[0]).not.toHaveProperty('model');
    expect(
      seen.filter((url) => url.includes('/usage/completions')),
    ).toHaveLength(2);
    expect(
      seen.filter((url) => url.includes('/organization/costs')),
    ).toHaveLength(1);
  });

  it('does not expose the admin key in connector errors', async () => {
    const fetcher: OpenAIAdminFetch = () => ({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: { message: 'bad key' } }),
    });

    await expect(
      fetchOpenAIAdminSnapshot({
        adminKey: 'super-secret-admin-key',
        startTime: 1_725_148_800,
        endTime: 1_725_235_200,
        fetcher,
      }),
    ).rejects.toThrow('OPENAI_ADMIN_API_401');

    await expect(
      fetchOpenAIAdminSnapshot({
        adminKey: 'super-secret-admin-key',
        startTime: 1_725_148_800,
        endTime: 1_725_235_200,
        fetcher,
      }),
    ).rejects.not.toThrow('super-secret-admin-key');
  });
});
