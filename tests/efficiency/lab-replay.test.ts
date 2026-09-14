import { describe, expect, it } from 'vitest';
import { replayFromOptimizationLab } from '../../src/efficiency/lab-replay.js';
import type { OptimizationLabEvidence } from '../../src/workbench/lab-view.js';

function lab(
  overrides: Partial<OptimizationLabEvidence> = {},
): OptimizationLabEvidence {
  return {
    recommendationId: 'rec-1',
    persistedDecision: 'OPTIMIZE',
    current: {
      configurationId: 'model-a',
      cost: '10',
      quality: null,
      p95LatencyMs: null,
      failureRate: null,
    },
    candidate: {
      configurationId: 'model-b',
      cost: '6',
      quality: '0.9',
      p95LatencyMs: '500',
      failureRate: '0',
    },
    constraints: [
      {
        name: 'Quality',
        kind: 'MINIMUM',
        required: '0.8',
        currentMeasured: null,
        candidateMeasured: '0.9',
      },
      {
        name: 'p95 latency',
        kind: 'MAXIMUM',
        required: '1000',
        currentMeasured: null,
        candidateMeasured: '500',
      },
    ],
    economics: {
      currency: 'USD',
      baselineCost: '10',
      candidateCost: '6',
      netSavingNumerator: '4',
      netSavingDenominator: '1',
      horizon: 'OBSERVED_PERIOD',
      evidenceRef: 'benchmark:rec-1',
      formulaVersion: 'economics-v1',
    },
    confidence: {
      band: 'HIGH',
      reasons: [],
    },
    evidenceLinks: [],
    isDemo: false,
    ...overrides,
  };
}

describe('replayFromOptimizationLab', () => {
  it('projects historical cost using persisted benchmark economics', () => {
    const result = replayFromOptimizationLab({
      lab: lab(),
      historicalBaselineCost: '1000',
      historicalWindowComparable: true,
    });

    expect(result.status).toBe('PROJECTED');
    expect(result.projectedCandidateCost).toEqual({
      numerator: '600',
      denominator: '1',
    });
    expect(result.projectedGrossSaving).toEqual({
      numerator: '400',
      denominator: '1',
    });
  });

  it('withholds replay when persisted comparable costs are missing', () => {
    const result = replayFromOptimizationLab({
      lab: lab({
        economics: {
          ...lab().economics,
          baselineCost: null,
        },
      }),
      historicalBaselineCost: '1000',
      historicalWindowComparable: true,
    });

    expect(result.status).toBe('INELIGIBLE_BASELINE');
    expect(result.reasons).toContain('LAB_COMPARABLE_COST_MISSING');
  });
});
