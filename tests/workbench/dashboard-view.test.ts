import { describe, expect, it } from 'vitest';
import {
  buildFounderDashboardView,
  type DashboardEvidence,
} from '../../src/workbench/dashboard-view.js';

function evidence(
  overrides: Partial<DashboardEvidence> = {},
): DashboardEvidence {
  return {
    organizationName: 'Acme AI',
    periodLabel: 'Sep 1–7, 2026',
    dataQuality: 'READY',
    observedSpend: {
      amount: '120.5',
      currency: 'USD',
      evidenceRef: 'import-1',
    },
    completeCalendarDays: 7,
    strongestAction: {
      recommendationId: 'rec-1',
      title: 'Benchmark a lower-cost model',
      state: 'OPPORTUNITY',
      decision: 'INSUFFICIENT_EVIDENCE',
      saving: {
        amount: '35',
        currency: 'USD',
        horizon: 'OBSERVED_PERIOD',
        evidenceRef: 'finding-1',
      },
      confidenceBand: 'MEDIUM',
      principalLimitation: 'Candidate quality has not been benchmarked yet.',
      nextAction: 'Run the representative workload benchmark.',
    },
    verifiedNetSavings: null,
    diagnosticFacts: [],
    isDemo: false,
    limitations: [],
    ...overrides,
  };
}

describe('founder dashboard view model', () => {
  it('keeps the strongest action potential until evidence advances the state', () => {
    const view = buildFounderDashboardView(evidence());
    expect(view.strongestAction?.stateLabel).toBe('Potential saving');
    expect(view.strongestAction?.decision).toBe('INSUFFICIENT_EVIDENCE');
    expect(view.monthlyProjectionAllowed).toBe(true);
  });

  it('suppresses monthly projection eligibility below seven complete days', () => {
    const view = buildFounderDashboardView(
      evidence({ completeCalendarDays: 6 }),
    );
    expect(view.monthlyProjectionAllowed).toBe(false);
  });

  it('preserves partial and no-data states without inventing zero spend', () => {
    expect(
      buildFounderDashboardView(
        evidence({ dataQuality: 'PARTIAL_DATA', observedSpend: null }),
      ).observedSpend,
    ).toBeNull();

    const noData = buildFounderDashboardView(
      evidence({
        dataQuality: 'NO_DATA',
        observedSpend: null,
        strongestAction: null,
      }),
    );
    expect(noData.observedSpend).toBeNull();
    expect(noData.strongestAction).toBeNull();
  });

  it('keeps a verified negative impact visible as a cost increase', () => {
    const view = buildFounderDashboardView(
      evidence({
        verifiedNetSavings: {
          numerator: '-25',
          denominator: '1',
          currency: 'USD',
          evidenceRef: 'verification-1',
          formulaVersion: 'economics-v1',
        },
      }),
    );
    expect(view.verifiedNetSavings).toMatchObject({
      direction: 'COST_INCREASE',
      exactNumerator: '-25',
      exactDenominator: '1',
    });
  });

  it('makes the synthetic demo disclaimer immutable in the view', () => {
    const view = buildFounderDashboardView(evidence({ isDemo: true }));
    expect(view.demoDisclaimer).toBe(
      'Synthetic demo data — not a customer result.',
    );
    expect(Object.isFrozen(view)).toBe(true);
  });
});
