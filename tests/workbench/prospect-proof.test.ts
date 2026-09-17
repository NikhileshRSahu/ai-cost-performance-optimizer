import { describe, expect, it } from 'vitest';
import type {
  DashboardRecommendationView,
  FounderDashboardView,
} from '../../src/workbench/dashboard-view.js';
import { buildProspectProofPack } from '../../src/workbench/prospect-proof.js';

function recommendation(): DashboardRecommendationView {
  return {
    recommendationId: 'rec-1',
    priorityRank: 1,
    title: 'Reduce output-token intensity',
    state: 'OPPORTUNITY',
    decision: 'OPTIMIZE',
    saving: {
      amount: '84.00',
      currency: 'USD',
      horizon: 'OBSERVED_PERIOD',
      evidenceRef: 'recommendation:rec-1',
    },
    modeledRange: null,
    detectionConfidence: 'MEDIUM',
    savingsConfidence: 'UNMEASURED',
    confidenceBand: 'MEDIUM',
    principalLimitation: null,
    nextAction: 'Run the bounded benchmark.',
    stateLabel: 'Potential saving',
  };
}

function baseView(
  overrides: Partial<FounderDashboardView> = {},
): FounderDashboardView {
  const bestFirstMove = recommendation();
  return {
    organizationName: 'Prospect AI',
    periodLabel: '2026-09-01 to 2026-09-07',
    dataQuality: 'READY',
    observedSpend: {
      amount: '420.00',
      currency: 'USD',
      evidenceRef: 'import:prospect-1',
    },
    recommendations: [bestFirstMove],
    bestFirstMove,
    nonOverlappingModeledTotal: null,
    strongestAction: bestFirstMove,
    verifiedNetSavings: null,
    diagnosticFacts: [],
    monthlyProjectionAllowed: true,
    demoDisclaimer: null,
    limitations: [],
    ...overrides,
  };
}

describe('prospect proof pack', () => {
  it('never turns synthetic demo data into prospect proof', () => {
    const pack = buildProspectProofPack(
      baseView({
        demoDisclaimer: 'Synthetic demo data — not a customer result.',
      }),
    );

    expect(pack.classification).toBe('SYNTHETIC_DEMO');
    expect(pack.customerResultClaimAllowed).toBe(false);
    expect(pack.publicationPermissionRequired).toBe(true);
    expect(pack.commercialSummary).toContain(
      'never as customer or prospect proof',
    );
  });

  it('requires ready usage evidence and a best first move', () => {
    const pack = buildProspectProofPack(
      baseView({
        dataQuality: 'PARTIAL_DATA',
        recommendations: [],
        bestFirstMove: null,
        strongestAction: null,
      }),
    );

    expect(pack.classification).toBe('INSUFFICIENT_EVIDENCE');
    expect(pack.customerResultClaimAllowed).toBe(false);
  });

  it('keeps potential savings separate from verified impact', () => {
    const pack = buildProspectProofPack(baseView());

    expect(pack.classification).toBe('SANITIZED_PROSPECT_EVIDENCE');
    expect(pack.strongestFinding?.state).toBe('OPPORTUNITY');
    expect(pack.verifiedNetSavings).toBeNull();
    expect(pack.commercialSummary).toContain('potential or tested');
  });

  it('includes verified impact only when canonical verification evidence exists', () => {
    const pack = buildProspectProofPack(
      baseView({
        verifiedNetSavings: {
          exactNumerator: '12500',
          exactDenominator: '100',
          currency: 'USD',
          evidenceRef: 'verification:v-1',
          formulaVersion: 'net-impact-v1',
          direction: 'SAVING',
        },
      }),
    );

    expect(pack.verifiedNetSavings).toMatchObject({
      numerator: '12500',
      denominator: '100',
      currency: 'USD',
      evidenceRef: 'verification:v-1',
      formulaVersion: 'net-impact-v1',
      direction: 'SAVING',
    });
    expect(pack.publicationPermissionRequired).toBe(true);
  });
});
