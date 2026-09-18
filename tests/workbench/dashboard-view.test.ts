import { describe, expect, it } from 'vitest';
import {
  buildFounderDashboardView,
  type DashboardEvidence,
  type DashboardRecommendationEvidence,
} from '../../src/workbench/dashboard-view.js';

function recommendation(
  overrides: Partial<DashboardRecommendationEvidence> = {},
): DashboardRecommendationEvidence {
  return {
    recommendationId: 'rec-1',
    priorityRank: 1,
    title: 'Benchmark a lower-cost model',
    state: 'OPPORTUNITY',
    decision: 'INSUFFICIENT_EVIDENCE',
    saving: null,
    modeledRange: {
      currency: 'USD',
      horizon: 'THIRTY_DAY_PROJECTION',
      low: '20',
      base: '30',
      high: '40',
      evidenceRef: 'finding-1',
      formulaVersion: 'scenario-v1',
      formula: 'eligibleVolume * (currentUnitCost - candidateUnitCost)',
      assumptions: {
        eligibleVolumeLow: '100',
        eligibleVolumeBase: '150',
        eligibleVolumeHigh: '200',
      },
      pricingRef: 'pricing-2026-09',
      overlapGroup: 'model-routing',
    },
    detectionConfidence: 'HIGH',
    savingsConfidence: 'MODELED',
    principalLimitation: 'Candidate quality has not been benchmarked yet.',
    nextAction: 'Run the representative workload benchmark.',
    ...overrides,
  };
}

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
    recommendations: [recommendation()],
    nonOverlappingModeledTotal: {
      currency: 'USD',
      horizon: 'THIRTY_DAY_PROJECTION',
      low: '20',
      base: '30',
      high: '40',
      evidenceRef: 'account-total',
      formulaVersion: 'scenario-total-v1',
      formula: 'overlap-safe sum of surfaced modeled scenarios',
      assumptions: {
        overlapPolicy: 'highest-conservative-case-per-overlap-group',
      },
      pricingRef: 'pricing-2026-09',
      overlapGroup: null,
    },
    verifiedNetSavings: null,
    diagnosticFacts: [],
    isDemo: false,
    limitations: [],
    ...overrides,
  };
}

describe('founder dashboard MRI view model', () => {
  it('exposes the ranked best first move without promoting evidence state', () => {
    const view = buildFounderDashboardView(evidence());

    expect(view.recommendations).toHaveLength(1);
    expect(view.bestFirstMove?.recommendationId).toBe('rec-1');
    expect(view.bestFirstMove?.stateLabel).toBe('Potential saving');
    expect(view.bestFirstMove?.detectionConfidence).toBe('HIGH');
    expect(view.bestFirstMove?.savingsConfidence).toBe('MODELED');
    expect(view.monthlyProjectionAllowed).toBe(true);
  });

  it('sorts deterministically and surfaces at most three findings', () => {
    const view = buildFounderDashboardView(
      evidence({
        recommendations: [
          recommendation({ recommendationId: 'rec-4', priorityRank: 4 }),
          recommendation({ recommendationId: 'rec-2', priorityRank: 2 }),
          recommendation({ recommendationId: 'rec-1', priorityRank: 1 }),
          recommendation({ recommendationId: 'rec-3', priorityRank: 3 }),
        ],
      }),
    );

    expect(view.recommendations.map((item) => item.recommendationId)).toEqual([
      'rec-1',
      'rec-2',
      'rec-3',
    ]);
    expect(view.bestFirstMove?.recommendationId).toBe('rec-1');
  });

  it('preserves provider source metadata for zero-usage states', () => {
    const view = buildFounderDashboardView(
      evidence({
        dataQuality: 'ZERO_USAGE',
        sourceKind: 'PROVIDER',
        providerName: 'OpenAI',
        observedSpend: null,
        recommendations: [],
      }),
    );

    expect(view.sourceKind).toBe('PROVIDER');
    expect(view.providerName).toBe('OpenAI');
    expect(view.dataQuality).toBe('ZERO_USAGE');
  });

  it('supports zero findings without inventing an opportunity', () => {
    const view = buildFounderDashboardView(
      evidence({ recommendations: [], nonOverlappingModeledTotal: null }),
    );

    expect(view.recommendations).toEqual([]);
    expect(view.bestFirstMove).toBeNull();
    expect(view.nonOverlappingModeledTotal).toBeNull();
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
        recommendations: [],
        nonOverlappingModeledTotal: null,
      }),
    );
    expect(noData.observedSpend).toBeNull();
    expect(noData.bestFirstMove).toBeNull();
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

  it('preserves and freezes calculation provenance for modeled ranges', () => {
    const view = buildFounderDashboardView(evidence());
    const range = view.recommendations[0]?.modeledRange;

    expect(range?.formula).toBe(
      'eligibleVolume * (currentUnitCost - candidateUnitCost)',
    );
    expect(range?.assumptions).toEqual({
      eligibleVolumeLow: '100',
      eligibleVolumeBase: '150',
      eligibleVolumeHigh: '200',
    });
    expect(Object.isFrozen(range)).toBe(true);
    expect(Object.isFrozen(range?.assumptions)).toBe(true);
    expect(Object.isFrozen(view.nonOverlappingModeledTotal?.assumptions)).toBe(
      true,
    );
  });

  it('freezes nested recommendations and modeled ranges', () => {
    const view = buildFounderDashboardView(evidence());

    expect(Object.isFrozen(view.recommendations)).toBe(true);
    expect(Object.isFrozen(view.recommendations[0])).toBe(true);
    expect(Object.isFrozen(view.recommendations[0]?.modeledRange)).toBe(true);
    expect(Object.isFrozen(view.nonOverlappingModeledTotal)).toBe(true);
  });

  it('preserves structured diagnostic evidence immutably', () => {
    const view = buildFounderDashboardView(
      evidence({
        diagnosticFacts: [
          {
            label: 'Cost per request',
            value: 'USD 0.10',
            evidenceRef: 'import-1#COST_PER_REQUEST',
            evidence: {
              exactCostPerRequest: '1/10',
              requests: '100',
            },
          },
        ],
      }),
    );

    expect(view.diagnosticFacts[0]?.evidence).toEqual({
      exactCostPerRequest: '1/10',
      requests: '100',
    });
    expect(Object.isFrozen(view.diagnosticFacts[0]?.evidence)).toBe(true);
  });

  it('makes the synthetic demo disclaimer immutable in the view', () => {
    const view = buildFounderDashboardView(evidence({ isDemo: true }));
    expect(view.demoDisclaimer).toBe(
      'Synthetic demo data — not a customer result.',
    );
    expect(Object.isFrozen(view)).toBe(true);
  });
});
