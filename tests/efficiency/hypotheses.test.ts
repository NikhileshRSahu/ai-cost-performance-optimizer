import { describe, expect, it } from 'vitest';
import {
  generateOptimizationHypotheses,
  type HypothesisPolicy,
} from '../../src/efficiency/hypotheses.js';
import type { UsageDiagnosis } from '../../src/efficiency/usage-diagnosis.js';

const policy: HypothesisPolicy = {
  maximumTopModelCostShare: '0.80',
  maximumOutputTokensPerRequest: '500',
  minimumCacheHitRatio: '0.50',
};

function diagnosis(facts: UsageDiagnosis['facts']): UsageDiagnosis {
  return {
    reportingCurrency: 'USD',
    includedRecords: 10,
    excludedCurrencyRecords: 0,
    facts,
    limitations: [],
  };
}

describe('generateOptimizationHypotheses', () => {
  it('turns measured retry cost into a testable hypothesis without calling it waste', () => {
    const result = generateOptimizationHypotheses({
      policy,
      diagnosis: diagnosis([
        {
          key: 'RETRY_ATTEMPT_COST',
          label: 'Repeated-attempt cost',
          value: 'USD 10.00',
          evidence: {
            exactRepeatedAttemptCost: '10/1',
          },
        },
      ]),
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.kind).toBe('RETRY_POLICY');
    expect(result[0]?.notClaimed).toContain('not assumed to be waste');
  });

  it('uses configured thresholds rather than hard-coded product claims', () => {
    const result = generateOptimizationHypotheses({
      policy,
      diagnosis: diagnosis([
        {
          key: 'TOP_MODEL_COST_SHARE',
          label: 'Top model cost concentration',
          value: 'model-a · 90.00%',
          evidence: {
            exactShare: '9/10',
          },
        },
        {
          key: 'OUTPUT_TOKENS_PER_REQUEST',
          label: 'Output tokens per request',
          value: '700.00',
          evidence: {
            exactOutputTokensPerRequest: '700/1',
          },
        },
        {
          key: 'CACHE_HIT_RATIO',
          label: 'Cache hit ratio',
          value: '20.00%',
          evidence: {
            exactHitRatio: '1/5',
          },
        },
      ]),
    });

    expect(result.map((item) => item.kind)).toEqual([
      'PROMPT_CACHING',
      'MODEL_PORTFOLIO_REVIEW',
      'OUTPUT_BUDGET',
    ]);
  });

  it('produces no hypothesis when supported evidence stays within policy', () => {
    const result = generateOptimizationHypotheses({
      policy,
      diagnosis: diagnosis([
        {
          key: 'TOP_MODEL_COST_SHARE',
          label: 'Top model cost concentration',
          value: 'model-a · 60.00%',
          evidence: {
            exactShare: '3/5',
          },
        },
        {
          key: 'OUTPUT_TOKENS_PER_REQUEST',
          label: 'Output tokens per request',
          value: '300.00',
          evidence: {
            exactOutputTokensPerRequest: '300/1',
          },
        },
        {
          key: 'CACHE_HIT_RATIO',
          label: 'Cache hit ratio',
          value: '70.00%',
          evidence: {
            exactHitRatio: '7/10',
          },
        },
      ]),
    });

    expect(result).toEqual([]);
  });
});
