import { describe, expect, it } from 'vitest';
import {
  buildOptimizationLabView,
  type OptimizationLabEvidence,
} from '../../src/workbench/lab-view.js';

function evidence(
  overrides: Partial<OptimizationLabEvidence> = {},
): OptimizationLabEvidence {
  return {
    recommendationId: 'rec-1',
    persistedDecision: 'OPTIMIZE',
    current: {
      configurationId: 'model-a',
      cost: '10',
      quality: '0.94',
      p95LatencyMs: '110',
      failureRate: '0.01',
    },
    candidate: {
      configurationId: 'model-b',
      cost: '6',
      quality: '0.92',
      p95LatencyMs: '95',
      failureRate: '0.01',
    },
    constraints: [
      {
        name: 'Quality',
        kind: 'MINIMUM',
        required: '0.9',
        currentMeasured: '0.94',
        candidateMeasured: '0.92',
      },
      {
        name: 'p95 latency',
        kind: 'MAXIMUM',
        required: '100',
        currentMeasured: '110',
        candidateMeasured: '95',
      },
    ],
    economics: {
      currency: 'USD',
      baselineCost: '10',
      candidateCost: '6',
      netSavingNumerator: '4',
      netSavingDenominator: '1',
      horizon: 'OBSERVED_PERIOD',
      evidenceRef: 'benchmark-1',
      formulaVersion: 'economics-v1',
    },
    confidence: {
      band: 'HIGH',
      reasons: ['Paired benchmark cases meet the suite target.'],
    },
    evidenceLinks: [
      { label: 'Benchmark evidence', ref: 'benchmark-1' },
      { label: 'Formula evidence', ref: 'calc-1' },
    ],
    isDemo: false,
    ...overrides,
  };
}

describe('Optimization Lab view model', () => {
  it('keeps OPTIMIZE only when every measured constraint passes', () => {
    const view = buildOptimizationLabView(evidence());
    expect(view.decision).toBe('OPTIMIZE');
    expect(
      view.constraints.every((constraint) => constraint.status === 'PASS'),
    ).toBe(true);
  });

  it('makes a measured constraint failure dominate positive saving', () => {
    const input = evidence();
    const view = buildOptimizationLabView({
      ...input,
      candidate: { ...input.candidate, quality: '0.89' },
      constraints: input.constraints.map((constraint) =>
        constraint.name === 'Quality'
          ? { ...constraint, candidateMeasured: '0.89' }
          : constraint,
      ),
    });
    expect(view.decision).toBe('DO_NOT_CHANGE');
    expect(view.economics.netSavingNumerator).toBe('4');
  });

  it('uses INSUFFICIENT_EVIDENCE when a required measurement is missing', () => {
    const input = evidence();
    const view = buildOptimizationLabView({
      ...input,
      constraints: input.constraints.map((constraint) =>
        constraint.name === 'Quality'
          ? { ...constraint, candidateMeasured: null }
          : constraint,
      ),
    });
    expect(view.decision).toBe('INSUFFICIENT_EVIDENCE');
  });

  it('passes exact equality at minimum and maximum boundaries', () => {
    const input = evidence();
    const view = buildOptimizationLabView({
      ...input,
      constraints: [
        {
          ...input.constraints[0]!,
          candidateMeasured: '0.9',
        },
        {
          ...input.constraints[1]!,
          candidateMeasured: '100',
        },
      ],
    });
    expect(view.constraints.map((constraint) => constraint.status)).toEqual([
      'PASS',
      'PASS',
    ]);
    expect(view.decision).toBe('OPTIMIZE');
  });

  it('keeps the synthetic disclaimer explicit', () => {
    expect(
      buildOptimizationLabView(evidence({ isDemo: true })).demoDisclaimer,
    ).toBe('Synthetic demo data — not a customer result.');
  });
});
