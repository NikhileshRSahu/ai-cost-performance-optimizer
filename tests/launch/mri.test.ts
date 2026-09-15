import { describe, expect, it } from 'vitest';
import {
  analyzeUsageEvidence,
  benchmarkCandidate,
  verifyComparableSavings,
} from '../../src/launch/mri.js';

describe('Evalomics launch MRI', () => {
  it('summarizes usage and creates evidence-bounded opportunities', () => {
    const result = analyzeUsageEvidence({
      reportingCurrency: 'USD',
      records: [
        {
          provider: 'openai',
          model: 'model-a',
          requests: '80',
          inputTokens: '80000',
          outputTokens: '32000',
          cachedInputTokens: '8000',
          totalCost: '24',
          currency: 'USD',
        },
        {
          provider: 'openai',
          model: 'model-b',
          requests: '20',
          inputTokens: '20000',
          outputTokens: '8000',
          cachedInputTokens: '2000',
          totalCost: '6',
          currency: 'USD',
        },
      ],
      policy: {
        minimumCacheHitRatio: '0.25',
        maximumOutputTokensPerRequest: '300',
        maximumModelRequestShare: '0.70',
      },
    });

    expect(result.metrics).toMatchObject({
      totalRequests: '100',
      observedSpend: '30.00',
      costPerRequest: '0.300000',
      outputTokensPerRequest: '400.00',
      cacheHitRatio: '10.00%',
    });
    expect(result.opportunities.map((item) => item.kind)).toEqual([
      'PROMPT_CACHING',
      'OUTPUT_BUDGET',
      'MODEL_CONCENTRATION',
    ]);
    expect(result.opportunities[2]?.evidence).toMatchObject({
      model: 'model-a',
      requestShare: '80.00%',
    });
    expect(result.limitations.join(' ')).toContain(
      'Model concentration is based on request volume, not attributed cost.',
    );
  });

  it('withholds mixed-currency spend from the reporting total', () => {
    const result = analyzeUsageEvidence({
      reportingCurrency: 'USD',
      records: [
        {
          provider: 'openai',
          model: 'model-a',
          requests: '10',
          inputTokens: '1000',
          outputTokens: '200',
          cachedInputTokens: '0',
          totalCost: '5',
          currency: 'USD',
        },
        {
          provider: 'anthropic',
          model: 'model-b',
          requests: '10',
          inputTokens: '1000',
          outputTokens: '200',
          cachedInputTokens: '0',
          totalCost: '7',
          currency: 'EUR',
        },
      ],
    });

    expect(result.metrics.observedSpend).toBe('5.00');
    expect(result.limitations.join(' ')).toContain(
      'Records outside USD are excluded from spend metrics.',
    );
  });
});

describe('benchmarkCandidate', () => {
  it('labels savings as tested only when the quality floor passes', () => {
    const result = benchmarkCandidate({
      baselineCost: '100',
      candidateCost: '70',
      baselineQuality: '0.90',
      candidateQuality: '0.88',
      requiredQuality: '0.85',
      currency: 'USD',
    });

    expect(result.decision).toBe('TESTED_SAVING');
    expect(result.testedSaving).toBe('30.00');
  });

  it('rejects a cheaper candidate that misses the quality floor', () => {
    const result = benchmarkCandidate({
      baselineCost: '100',
      candidateCost: '60',
      baselineQuality: '0.90',
      candidateQuality: '0.80',
      requiredQuality: '0.85',
      currency: 'USD',
    });

    expect(result.decision).toBe('QUALITY_FLOOR_FAILED');
    expect(result.testedSaving).toBeNull();
  });
});

describe('verifyComparableSavings', () => {
  it('verifies only explicitly comparable post-change evidence', () => {
    const result = verifyComparableSavings({
      baselineCost: '1000',
      postChangeCost: '760',
      currency: 'USD',
      comparableWorkloadConfirmed: true,
    });

    expect(result.state).toBe('VERIFIED');
    expect(result.verifiedSaving).toBe('240.00');
  });

  it('withholds verification when comparability is not confirmed', () => {
    const result = verifyComparableSavings({
      baselineCost: '1000',
      postChangeCost: '760',
      currency: 'USD',
      comparableWorkloadConfirmed: false,
    });

    expect(result.state).toBe('WITHHELD');
    expect(result.verifiedSaving).toBeNull();
  });
});
