import { describe, expect, it } from 'vitest';
import { diagnoseUsage } from '../../src/efficiency/usage-diagnosis.js';
import type { UsageRecord } from '../../src/usage/contracts.js';

function record(
  overrides: Partial<UsageRecord> = {},
): UsageRecord {
  return {
    organizationId: 'org-1',
    source: 'CSV',
    granularity: 'REQUEST',
    intervalStart: '2026-09-01T00:00:00Z',
    intervalEnd: '2026-09-01T00:01:00Z',
    provider: 'openai',
    model: 'model-a',
    requests: '1',
    totalCost: '1.20',
    currency: 'USD',
    sourceEventId: null,
    project: null,
    workspace: null,
    workload: 'support',
    configurationId: 'cfg-a',
    operationId: 'op-1',
    attemptNumber: '1',
    retryCount: '0',
    inputTokens: '100',
    cachedInputTokens: '20',
    cacheWriteTokens: '0',
    outputTokens: '40',
    outputCost: '0.40',
    toolCalls: '0',
    toolCost: '0',
    successes: '1',
    failures: '0',
    latencyP50Ms: '400',
    latencyP95Ms: '700',
    stablePrefixHash: null,
    stablePrefixTokens: null,
    cacheEligibleInputTokens: '50',
    sourceLine: 2,
    fingerprint: 'a'.repeat(64),
    isDemo: false,
    ...overrides,
  };
}

describe('diagnoseUsage', () => {
  it('computes exact cost-per-request and cost-per-success from supported evidence', () => {
    const diagnosis = diagnoseUsage({
      reportingCurrency: 'USD',
      records: [
        record(),
        record({
          totalCost: '0.80',
          model: 'model-b',
          sourceLine: 3,
          fingerprint: 'b'.repeat(64),
        }),
      ],
    });

    expect(
      diagnosis.facts.find((item) => item.key === 'COST_PER_REQUEST')?.value,
    ).toBe('USD 1.000000');
    expect(
      diagnosis.facts.find((item) => item.key === 'COST_PER_SUCCESS')?.value,
    ).toBe('USD 1.000000');
  });

  it('measures concentration, retry cost, output intensity and cache coverage', () => {
    const diagnosis = diagnoseUsage({
      reportingCurrency: 'USD',
      records: [
        record({ totalCost: '3.00' }),
        record({
          totalCost: '1.00',
          attemptNumber: '2',
          successes: '0',
          failures: '1',
          sourceLine: 3,
          fingerprint: 'b'.repeat(64),
        }),
      ],
    });

    expect(
      diagnosis.facts.find((item) => item.key === 'TOP_MODEL_COST_SHARE')?.value,
    ).toBe('model-a · 100.00%');
    expect(
      diagnosis.facts.find((item) => item.key === 'RETRY_ATTEMPT_COST')?.value,
    ).toBe('USD 1.00');
    expect(
      diagnosis.facts.find(
        (item) => item.key === 'OUTPUT_TOKENS_PER_REQUEST',
      )?.value,
    ).toBe('40.00');
    expect(
      diagnosis.facts.find((item) => item.key === 'CACHE_HIT_RATIO')?.value,
    ).toBe('40.00%');
  });

  it('withholds outcome and retry claims when required evidence is missing', () => {
    const diagnosis = diagnoseUsage({
      reportingCurrency: 'USD',
      records: [
        record({
          successes: null,
          failures: null,
          attemptNumber: null,
          outputTokens: null,
          cachedInputTokens: null,
          cacheEligibleInputTokens: null,
        }),
      ],
    });

    expect(
      diagnosis.facts.some((item) => item.key === 'COST_PER_SUCCESS'),
    ).toBe(false);
    expect(
      diagnosis.limitations.join(' '),
    ).toContain('Cost per successful outcome is withheld');
    expect(diagnosis.limitations.join(' ')).toContain(
      'Retry cost is withheld',
    );
  });

  it('excludes other currencies instead of silently converting them', () => {
    const diagnosis = diagnoseUsage({
      reportingCurrency: 'USD',
      records: [
        record(),
        record({
          currency: 'EUR',
          sourceLine: 3,
          fingerprint: 'b'.repeat(64),
        }),
      ],
    });

    expect(diagnosis.includedRecords).toBe(1);
    expect(diagnosis.excludedCurrencyRecords).toBe(1);
    expect(diagnosis.limitations.join(' ')).toContain(
      'outside the reporting currency',
    );
  });
});
