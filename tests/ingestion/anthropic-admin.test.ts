import { describe, expect, it } from 'vitest';
import {
  fetchAnthropicAdminSnapshot,
  type AnthropicAdminFetch,
} from '../../src/ingestion/connectors/anthropic-admin.js';

describe('Anthropic Admin connector', () => {
  it('paginates usage and cost evidence with provider dimensions intact', async () => {
    const seen: string[] = [];
    const fetcher: AnthropicAdminFetch = (url, init) => {
      seen.push(url);
      expect(init.headers['x-api-key']).toBe('anthropic-admin-test-key');
      expect(init.headers['anthropic-version']).toBe('2023-06-01');

      if (url.includes('/usage_report/messages')) {
        if (url.includes('page=usage-next')) {
          return {
            ok: true,
            status: 200,
            json: () => ({
              data: [
                {
                  starting_at: '2026-09-02T00:00:00Z',
                  ending_at: '2026-09-03T00:00:00Z',
                  results: [
                    {
                      uncached_input_tokens: 300,
                      cache_creation: {
                        ephemeral_1h_input_tokens: 0,
                        ephemeral_5m_input_tokens: 100,
                      },
                      cache_read_input_tokens: 150,
                      output_tokens: 75,
                      server_tool_use: { web_search_requests: 0 },
                      api_key_id: 'apikey_2',
                      workspace_id: 'workspace_1',
                      model: 'claude-test-2',
                      service_tier: 'standard',
                      context_window: '0-200k',
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
            data: [
              {
                starting_at: '2026-09-01T00:00:00Z',
                ending_at: '2026-09-02T00:00:00Z',
                results: [
                  {
                    uncached_input_tokens: 1500,
                    cache_creation: {
                      ephemeral_1h_input_tokens: 1000,
                      ephemeral_5m_input_tokens: 500,
                    },
                    cache_read_input_tokens: 200,
                    output_tokens: 500,
                    server_tool_use: { web_search_requests: 10 },
                    api_key_id: 'apikey_1',
                    workspace_id: 'workspace_1',
                    model: 'claude-test-1',
                    service_tier: 'standard',
                    context_window: '0-200k',
                  },
                ],
              },
            ],
            has_more: true,
            next_page: 'usage-next',
          }),
        };
      }

      if (url.includes('/organizations/cost_report')) {
        return {
          ok: true,
          status: 200,
          json: () => ({
            data: [
              {
                starting_at: '2026-09-01T00:00:00Z',
                ending_at: '2026-09-02T00:00:00Z',
                results: [
                  {
                    amount: '123.78912',
                    currency: 'USD',
                    cost_type: 'tokens',
                    description: 'Claude Test Usage - Input Tokens',
                    workspace_id: 'workspace_1',
                    model: 'claude-test-1',
                    service_tier: 'standard',
                    token_type: 'uncached_input_tokens',
                    context_window: '0-200k',
                    inference_geo: 'global',
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

    const result = await fetchAnthropicAdminSnapshot({
      adminKey: 'anthropic-admin-test-key',
      startingAt: '2026-09-01T00:00:00Z',
      endingAt: '2026-09-03T00:00:00Z',
      fetcher,
    });

    expect(result.usage).toHaveLength(2);
    expect(result.costs).toHaveLength(1);
    expect(result.usage[0]).toMatchObject({
      uncachedInputTokens: '1500',
      cacheCreationOneHourInputTokens: '1000',
      cacheCreationFiveMinuteInputTokens: '500',
      cacheReadInputTokens: '200',
      outputTokens: '500',
      webSearchRequests: '10',
      apiKeyId: 'apikey_1',
      workspaceId: 'workspace_1',
      model: 'claude-test-1',
    });
    expect(result.costs[0]).toMatchObject({
      amountLowestUnit: '123.78912',
      currency: 'USD',
      workspaceId: 'workspace_1',
      model: 'claude-test-1',
      tokenType: 'uncached_input_tokens',
    });
    expect(
      seen.filter((url) => url.includes('/usage_report/messages')),
    ).toHaveLength(2);
    expect(
      seen.filter((url) => url.includes('/organizations/cost_report')),
    ).toHaveLength(1);
  });

  it('never includes the admin key in connector errors', async () => {
    const fetcher: AnthropicAdminFetch = () => ({
      ok: false,
      status: 401,
      json: () => ({ error: { message: 'bad key' } }),
    });

    await expect(
      fetchAnthropicAdminSnapshot({
        adminKey: 'anthropic-super-secret',
        startingAt: '2026-09-01T00:00:00Z',
        endingAt: '2026-09-02T00:00:00Z',
        fetcher,
      }),
    ).rejects.toThrow('ANTHROPIC_ADMIN_API_401');

    await expect(
      fetchAnthropicAdminSnapshot({
        adminKey: 'anthropic-super-secret',
        startingAt: '2026-09-01T00:00:00Z',
        endingAt: '2026-09-02T00:00:00Z',
        fetcher,
      }),
    ).rejects.not.toThrow('anthropic-super-secret');
  });
});
