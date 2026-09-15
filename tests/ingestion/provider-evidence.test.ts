import { describe, expect, it } from 'vitest';
import { normalizeOpenAIAdminSnapshot } from '../../src/ingestion/connectors/openai-normalize.js';
import { diagnoseProviderEvidence } from '../../src/efficiency/provider-usage-diagnosis.js';

describe('provider evidence normalization', () => {
  it('keeps OpenAI usage and billing evidence separate', () => {
    const normalized = normalizeOpenAIAdminSnapshot({
      organizationId: 'org_1',
      snapshot: {
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
            model: 'gpt-test',
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
      },
    });

    expect(normalized.usage).toHaveLength(1);
    expect(normalized.costs).toHaveLength(1);
    expect(normalized.usage[0]).not.toHaveProperty('totalCost');
    expect(normalized.costs[0]).not.toHaveProperty('model');
    expect(normalized.usage[0]?.source).toBe('OPENAI_ADMIN_API');
    expect(normalized.costs[0]?.source).toBe('OPENAI_ADMIN_API');
    expect(normalized.usage[0]?.fingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(normalized.costs[0]?.fingerprint).toMatch(/^[a-f0-9]{64}$/);
  });

  it('builds MRI facts without fabricating model-level cost', () => {
    const normalized = normalizeOpenAIAdminSnapshot({
      organizationId: 'org_1',
      snapshot: {
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
            model: 'gpt-test',
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
      },
    });

    const diagnosis = diagnoseProviderEvidence({
      usage: normalized.usage,
      costs: normalized.costs,
      reportingCurrency: 'USD',
    });

    expect(diagnosis.observedSpend).toMatchObject({
      amount: '1.25',
      currency: 'USD',
    });
    expect(diagnosis.facts.map((fact) => fact.key)).toContain(
      'COST_PER_REQUEST',
    );
    expect(diagnosis.facts.map((fact) => fact.key)).toContain(
      'OUTPUT_TOKENS_PER_REQUEST',
    );
    expect(diagnosis.facts.map((fact) => fact.key)).toContain(
      'CACHED_INPUT_TOKEN_SHARE',
    );
    expect(diagnosis.facts.map((fact) => fact.key)).not.toContain(
      'TOP_MODEL_COST_SHARE',
    );
    expect(diagnosis.limitations).toContain(
      'Model-level cost attribution is withheld because provider billing evidence is not model-scoped.',
    );
  });
});
