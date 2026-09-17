import { describe, expect, it } from 'vitest';
import {
  normalizeAnthropicAdminSnapshot,
  normalizeOpenAIAdminSnapshot,
} from '../../src/ingestion/provider-normalization.js';

describe('provider evidence normalization', () => {
  it('normalizes OpenAI aggregate usage without allocating separate cost evidence', () => {
    const snapshot = {
      usage: [
        {
          intervalStart: '2026-09-01T00:00:00.000Z',
          intervalEnd: '2026-09-02T00:00:00.000Z',
          inputTokens: '1000',
          outputTokens: '200',
          inputCachedTokens: '400',
          requests: '5',
          projectId: 'proj_1',
          userId: null,
          apiKeyId: 'key_1',
          model: 'gpt-test-1',
          batch: false,
          serviceTier: null,
        },
      ],
      costs: [
        {
          intervalStart: '2026-09-01T00:00:00.000Z',
          intervalEnd: '2026-09-02T00:00:00.000Z',
          amount: '1.25',
          currency: 'USD',
          projectId: 'proj_1',
          lineItem: 'Model usage',
        },
      ],
    } as const;

    const result = normalizeOpenAIAdminSnapshot({
      organizationId: 'org_1',
      snapshot,
    });

    expect(result.usage).toHaveLength(1);
    expect(result.costs).toHaveLength(1);
    expect(result.usage[0]).toMatchObject({
      source: 'OPENAI_ADMIN_API',
      provider: 'openai',
      organizationId: 'org_1',
      model: 'gpt-test-1',
      projectId: 'proj_1',
      workspaceId: null,
      apiKeyId: 'key_1',
      requests: '5',
      inputTokens: '1000',
      cachedInputTokens: '400',
      cacheWriteTokens: '0',
      outputTokens: '200',
    });
    expect(result.costs[0]).toMatchObject({
      source: 'OPENAI_ADMIN_API',
      provider: 'openai',
      amount: '1.25',
      amountUnit: 'MAJOR',
      currency: 'USD',
      projectId: 'proj_1',
      workspaceId: null,
      model: null,
      description: 'Model usage',
    });
    expect(result.usage[0]).not.toHaveProperty('totalCost');
    expect(result.usage[0]?.fingerprint).toHaveLength(64);
    expect(result.costs[0]?.fingerprint).toHaveLength(64);
  });

  it('normalizes Anthropic cache evidence and preserves lowest-unit cost semantics', () => {
    const snapshot = {
      usage: [
        {
          intervalStart: '2026-09-01T00:00:00Z',
          intervalEnd: '2026-09-02T00:00:00Z',
          uncachedInputTokens: '1500',
          cacheCreationOneHourInputTokens: '1000',
          cacheCreationFiveMinuteInputTokens: '500',
          cacheReadInputTokens: '200',
          outputTokens: '500',
          webSearchRequests: '10',
          apiKeyId: 'apikey_1',
          workspaceId: 'workspace_1',
          model: 'claude-test-1',
          serviceTier: 'standard',
          contextWindow: '0-200k',
        },
      ],
      costs: [
        {
          intervalStart: '2026-09-01T00:00:00Z',
          intervalEnd: '2026-09-02T00:00:00Z',
          amountLowestUnit: '123.78912',
          currency: 'USD',
          costType: 'tokens',
          description: 'Claude Test Usage - Input Tokens',
          workspaceId: 'workspace_1',
          model: 'claude-test-1',
          serviceTier: 'standard',
          tokenType: 'uncached_input_tokens',
          contextWindow: '0-200k',
          inferenceGeo: 'global',
        },
      ],
    } as const;

    const result = normalizeAnthropicAdminSnapshot({
      organizationId: 'org_1',
      snapshot,
    });

    expect(result.usage[0]).toMatchObject({
      source: 'ANTHROPIC_ADMIN_API',
      provider: 'anthropic',
      requests: null,
      inputTokens: '1500',
      cachedInputTokens: '200',
      cacheWriteTokens: '1500',
      outputTokens: '500',
      projectId: null,
      workspaceId: 'workspace_1',
      apiKeyId: 'apikey_1',
      model: 'claude-test-1',
      serviceTier: 'standard',
    });
    expect(result.costs[0]).toMatchObject({
      amount: '123.78912',
      amountUnit: 'LOWEST',
      currency: 'USD',
      workspaceId: 'workspace_1',
      model: 'claude-test-1',
      tokenType: 'uncached_input_tokens',
      coverageLimitation:
        'Priority Tier costs are not included in the Anthropic cost report.',
    });
  });

  it('keeps nullable provider dimensions nullable and fingerprints deterministically', () => {
    const snapshot = {
      usage: [
        {
          intervalStart: '2026-09-01T00:00:00Z',
          intervalEnd: '2026-09-02T00:00:00Z',
          uncachedInputTokens: '10',
          cacheCreationOneHourInputTokens: '0',
          cacheCreationFiveMinuteInputTokens: '0',
          cacheReadInputTokens: '0',
          outputTokens: '2',
          webSearchRequests: '0',
          apiKeyId: null,
          workspaceId: null,
          model: null,
          serviceTier: null,
          contextWindow: null,
        },
      ],
      costs: [],
    } as const;

    const first = normalizeAnthropicAdminSnapshot({
      organizationId: 'org_1',
      snapshot,
    });
    const second = normalizeAnthropicAdminSnapshot({
      organizationId: 'org_1',
      snapshot,
    });

    expect(first.usage[0]).toMatchObject({
      model: null,
      workspaceId: null,
      apiKeyId: null,
      requests: null,
    });
    expect(first.usage[0]?.fingerprint).toBe(second.usage[0]?.fingerprint);
  });
});
