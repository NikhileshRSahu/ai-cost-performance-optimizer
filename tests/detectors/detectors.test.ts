import { describe, expect, it } from 'vitest';
import {
  detectCostAnomaly,
  detectExcessiveOutput,
  detectModelRightSizing,
  detectPromptCaching,
  detectRetryRepeatedCall,
} from '../../src/detectors/detectors.js';
import type { UsageRecord } from '../../src/usage/contracts.js';

function record(overrides: Partial<UsageRecord> = {}): UsageRecord {
  return {
    organizationId: 'org',
    source: 'CSV',
    granularity: 'AGGREGATE_BUCKET',
    intervalStart: '2026-09-01T00:00:00Z',
    intervalEnd: '2026-09-02T00:00:00Z',
    provider: 'openai',
    model: 'gpt-x',
    requests: '10',
    totalCost: '10',
    currency: 'USD',
    sourceEventId: null,
    project: null,
    workspace: null,
    workload: 'classification',
    configurationId: 'current',
    operationId: null,
    attemptNumber: null,
    retryCount: null,
    inputTokens: null,
    cachedInputTokens: null,
    cacheWriteTokens: null,
    outputTokens: null,
    outputCost: null,
    toolCalls: null,
    toolCost: null,
    successes: null,
    failures: null,
    latencyP50Ms: null,
    latencyP95Ms: null,
    stablePrefixHash: null,
    stablePrefixTokens: null,
    cacheEligibleInputTokens: null,
    sourceLine: 2,
    fingerprint: 'a'.repeat(64),
    isDemo: true,
    ...overrides,
  };
}

describe('deterministic opportunity detectors', () => {
  it('flags excessive output only when both configured thresholds are exceeded', () => {
    const result = detectExcessiveOutput({
      records: [
        record({
          requests: '10',
          outputTokens: '2000',
          outputCost: '6',
          totalCost: '10',
        }),
      ],
      workload: 'classification',
      findingId: 'f-output',
      maxOutputTokensPerRequest: '100',
      maxOutputCostShare: '0.5',
    });

    expect(result.status).toBe('FINDING');
    expect(result.finding?.type).toBe('EXCESSIVE_OUTPUT');
    expect(result.finding?.measuredFacts.outputTokensPerRequest).toBe('200/1');
    expect(result.finding?.notClaimed).toContain('not assumed');
  });

  it('measures repeated request attempts without calling all repeats waste', () => {
    const result = detectRetryRepeatedCall({
      records: [
        record({
          granularity: 'REQUEST',
          requests: '1',
          operationId: 'op-1',
          attemptNumber: '1',
          totalCost: '1',
        }),
        record({
          granularity: 'REQUEST',
          requests: '1',
          operationId: 'op-1',
          attemptNumber: '2',
          totalCost: '2',
          sourceLine: 3,
          fingerprint: 'b'.repeat(64),
        }),
      ],
      workload: 'classification',
      findingId: 'f-retry',
    });

    expect(result.status).toBe('FINDING');
    expect(result.finding?.measuredFacts.repeatedAttemptCost).toBe('2/1');
    expect(result.finding?.notClaimed).toContain('not assumed');
  });

  it('declines caching when eligibility evidence is absent', () => {
    const result = detectPromptCaching({
      records: [record({ cachedInputTokens: '100' })],
      workload: 'classification',
      findingId: 'f-cache',
      minimumCacheHitRatio: '0.8',
    });

    expect(result.status).toBe('INSUFFICIENT_EVIDENCE');
    expect(result.reasons).toContain('CACHE_ELIGIBILITY_EVIDENCE_MISSING');
  });

  it('flags explicitly eligible but poorly cached input', () => {
    const result = detectPromptCaching({
      records: [
        record({
          cachedInputTokens: '20',
          cacheEligibleInputTokens: '100',
        }),
      ],
      workload: 'classification',
      findingId: 'f-cache',
      minimumCacheHitRatio: '0.8',
    });

    expect(result.status).toBe('FINDING');
    expect(result.finding?.measuredFacts.cacheHitRatio).toBe('1/5');
  });

  it('creates a right-sizing hypothesis without claiming candidate quality', () => {
    const result = detectModelRightSizing({
      records: [record({ totalCost: '100', requests: '100' })],
      workload: 'classification',
      findingId: 'f-rightsize',
      candidateConfigurationId: 'candidate',
      candidateComparableCost: '60',
    });

    expect(result.status).toBe('FINDING');
    expect(result.finding?.measuredFacts.potentialComparableSaving).toBe(
      '40/1',
    );
    expect(result.finding?.notClaimed).toContain('not claimed');
  });

  it('requires stable anomaly scope and excludes the assessed day from history', () => {
    const history = Array.from({ length: 14 }, (_, index) => ({
      date: `2026-08-${String(index + 1).padStart(2, '0')}`,
      cost: index % 2 === 0 ? '9' : '11',
    }));

    expect(
      detectCostAnomaly({
        history,
        current: { date: '2026-09-01', cost: '20' },
        findingId: 'f-anomaly',
        materialityThreshold: '2',
        stableScope: false,
      }).reasons,
    ).toContain('STABLE_SCOPE_REQUIRED');

    const contaminated = [...history];
    contaminated[0] = { date: '2026-09-01', cost: '9' };
    expect(
      detectCostAnomaly({
        history: contaminated,
        current: { date: '2026-09-01', cost: '20' },
        findingId: 'f-anomaly',
        materialityThreshold: '2',
        stableScope: true,
      }).reasons,
    ).toContain('ASSESSED_DAY_MUST_BE_EXCLUDED_FROM_HISTORY');
  });

  it('flags a robust cost anomaly from fourteen prior comparable days', () => {
    const history = Array.from({ length: 14 }, (_, index) => ({
      date: `2026-08-${String(index + 1).padStart(2, '0')}`,
      cost: index < 7 ? '9' : '11',
    }));

    const result = detectCostAnomaly({
      history,
      current: { date: '2026-09-01', cost: '20' },
      findingId: 'f-anomaly',
      materialityThreshold: '2',
      stableScope: true,
    });

    expect(result.status).toBe('FINDING');
    expect(result.finding?.type).toBe('COST_ANOMALY');
    expect(result.finding?.notClaimed).toContain('not a savings claim');
  });
});
