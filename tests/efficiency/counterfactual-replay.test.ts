import { describe, expect, it } from 'vitest';
import type { BenchmarkEvaluation } from '../../src/benchmarks/evaluate.js';
import { replayHistoricalCounterfactual } from '../../src/efficiency/counterfactual-replay.js';

function benchmark(
  overrides: Partial<BenchmarkEvaluation> = {},
): BenchmarkEvaluation {
  return {
    decision: 'OPTIMIZE',
    reasons: [],
    pairedValidCases: 30,
    metrics: {
      candidateQuality: { numerator: '19', denominator: '20' },
      candidateP95LatencyMs: { numerator: '700', denominator: '1' },
      candidateFailureRate: { numerator: '0', denominator: '1' },
      currentComparableCost: { numerator: '100', denominator: '1' },
      candidateComparableCost: { numerator: '70', denominator: '1' },
      netSaving: { numerator: '30', denominator: '1' },
    },
    confidence: {
      score: 0.9,
      band: 'HIGH',
      reasons: [],
      components: {
        dataQuality: 1,
        sampleSize: 1,
        stability: 1,
      },
    },
    ...overrides,
  };
}

describe('replayHistoricalCounterfactual', () => {
  it('projects benchmark cost ratio onto a comparable historical baseline exactly', () => {
    const result = replayHistoricalCounterfactual({
      historicalBaselineCost: '1000.00',
      historicalWindowComparable: true,
      benchmark: benchmark(),
    });

    expect(result.status).toBe('PROJECTED');
    expect(result.benchmarkCostRatio).toEqual({
      numerator: '7',
      denominator: '10',
    });
    expect(result.projectedCandidateCost).toEqual({
      numerator: '700',
      denominator: '1',
    });
    expect(result.projectedGrossSaving).toEqual({
      numerator: '300',
      denominator: '1',
    });
    expect(result.claimBoundary).toContain('not verified savings');
  });

  it('withholds projection when the benchmark did not approve optimization', () => {
    const result = replayHistoricalCounterfactual({
      historicalBaselineCost: '1000',
      historicalWindowComparable: true,
      benchmark: benchmark({
        decision: 'DO_NOT_CHANGE',
        reasons: ['QUALITY_BELOW_REQUIREMENT'],
      }),
    });

    expect(result.status).toBe('INELIGIBLE_BENCHMARK');
    expect(result.projectedGrossSaving).toBeNull();
    expect(result.reasons).toContain('BENCHMARK_NOT_APPROVED_FOR_OPTIMIZATION');
  });

  it('withholds projection when the historical window is not comparable', () => {
    const result = replayHistoricalCounterfactual({
      historicalBaselineCost: '1000',
      historicalWindowComparable: false,
      benchmark: benchmark(),
    });

    expect(result.status).toBe('INELIGIBLE_BASELINE');
    expect(result.projectedCandidateCost).toBeNull();
    expect(result.reasons).toContain('HISTORICAL_WINDOW_NOT_COMPARABLE');
  });

  it('withholds projection when benchmark current cost is zero', () => {
    const result = replayHistoricalCounterfactual({
      historicalBaselineCost: '1000',
      historicalWindowComparable: true,
      benchmark: benchmark({
        metrics: {
          ...benchmark().metrics,
          currentComparableCost: { numerator: '0', denominator: '1' },
        },
      }),
    });

    expect(result.status).toBe('INELIGIBLE_BASELINE');
    expect(result.reasons).toContain('BENCHMARK_CURRENT_COST_MUST_BE_POSITIVE');
  });
});
