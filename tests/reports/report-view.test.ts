import { describe, expect, it } from 'vitest';
import {
  buildOptimizationReportView,
  type OptimizationReportEvidence,
} from '../../src/reports/report-view.js';

function evidence(
  overrides: Partial<OptimizationReportEvidence> = {},
): OptimizationReportEvidence {
  return {
    organizationName: 'Acme AI',
    reportPeriod: '2026-09-01 to 2026-09-07',
    dataQuality: 'READY',
    observedSpend: {
      label: 'Observed spend',
      amount: '120.50',
      currency: 'USD',
      state: 'OBSERVED',
      horizon: '2026-09-01 to 2026-09-07',
      evidenceRef: 'import:1',
      formulaVersion: 'source-cost-v1',
    },
    opportunity: {
      measuredFact: 'Model A handled the ranked workload volume.',
      inference: 'A lower-cost candidate may reduce comparable spend.',
      hypothesis: 'Benchmark Model B on the same workload cases.',
      savingState: 'OPPORTUNITY',
    },
    benchmark: {
      decision: 'OPTIMIZE',
      currentConfiguration: 'model-a',
      candidateConfiguration: 'model-b',
      constraintSummary: ['Quality: PASS', 'p95 latency: PASS'],
    },
    economics: {
      label: 'Tested net saving',
      amount: '40.00',
      currency: 'USD',
      state: 'TESTED',
      horizon: 'OBSERVED_PERIOD',
      evidenceRef: 'benchmark:1',
      formulaVersion: 'economics-v1',
    },
    confidence: {
      band: 'HIGH',
      reasons: ['Paired sample target met.'],
    },
    implementation: {
      proposedChange: 'Canary model-b for 10% of workload traffic.',
      rollbackInstructions: ['Restore model-a configuration.'],
    },
    verification: {
      status: 'PENDING',
      summary: 'Comparable post-change data is not available yet.',
      financialClaim: null,
    },
    methodologyVersion: 'optimizer-v0',
    limitations: [],
    isDemo: false,
    ...overrides,
  };
}

describe('optimization report view model', () => {
  it('keeps required report sections in the professional artifact', () => {
    const view = buildOptimizationReportView(evidence());
    expect(view.sections.map((section) => section.id)).toEqual([
      'executive-summary',
      'scope-data-quality',
      'opportunity',
      'benchmark',
      'economics',
      'confidence',
      'implementation',
      'verification',
      'methodology-limitations',
    ]);
  });

  it('requires traceable metadata on every financial claim', () => {
    const view = buildOptimizationReportView(evidence());
    for (const claim of view.financialClaims) {
      expect(claim.state).toBeTruthy();
      expect(claim.horizon).toBeTruthy();
      expect(claim.currency).toMatch(/^[A-Z]{3}$/);
      expect(claim.evidenceRef).toBeTruthy();
      expect(claim.formulaVersion).toBeTruthy();
    }
  });

  it('does not turn unavailable spend into zero', () => {
    const view = buildOptimizationReportView(evidence({ observedSpend: null }));
    expect(
      view.financialClaims.some((claim) => claim.label === 'Observed spend'),
    ).toBe(false);
    expect(view.limitations).toContain(
      'Observed spend is unavailable for the selected report scope.',
    );
  });

  it('permanently labels synthetic reports', () => {
    const view = buildOptimizationReportView(evidence({ isDemo: true }));
    expect(view.demoDisclaimer).toBe(
      'Synthetic demo data — not a customer result.',
    );
  });
});
