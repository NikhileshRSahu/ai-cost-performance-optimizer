import { describe, expect, it } from 'vitest';
import type { OptimizationHypothesis } from '../../src/efficiency/hypotheses.js';
import { generateImplementationGuide } from '../../src/implementation/generate-guide.js';

function hypothesis(
  kind: OptimizationHypothesis['kind'],
): OptimizationHypothesis {
  return {
    id: 'hypothesis-1',
    kind,
    title: 'Test the approved candidate',
    trigger: 'Measured evidence triggered a bounded test.',
    mechanism: 'Use the benchmarked candidate on an eligible workload slice.',
    testPlan: 'Compare current and candidate on identical evaluation cases.',
    qualityGuard: 'Reject the rollout if the configured quality floor fails.',
    notClaimed: 'No production saving is claimed before verification.',
    evidenceKeys: ['TOP_MODEL_COST_SHARE'],
  };
}

describe('generateImplementationGuide', () => {
  it.each([
    'RETRY_POLICY',
    'PROMPT_CACHING',
    'MODEL_PORTFOLIO_REVIEW',
    'OUTPUT_BUDGET',
  ] as const)('generates a complete review-required package for %s', (kind) => {
    const guide = generateImplementationGuide({
      hypothesis: hypothesis(kind),
      recommendationId: 'rec-1',
      organizationId: 'org-1',
      workload: 'support-classification',
      environment: 'production',
      expectedEconomicsEvidenceRef: 'benchmark:rec-1',
    });

    expect(guide.prerequisites.length).toBeGreaterThan(0);
    expect(guide.rolloutSteps.length).toBeGreaterThan(0);
    expect(guide.metricsToWatch.length).toBeGreaterThan(0);
    expect(guide.stopConditions).toContain(
      'Reject the rollout if the configured quality floor fails.',
    );
    expect(guide.rollbackInstructions.length).toBeGreaterThan(0);
    expect(guide.reviewedByOperatorUserId).toBeNull();
    expect(guide.reviewedAt).toBeNull();
  });

  it('keeps implementation economics linked to benchmark evidence', () => {
    const guide = generateImplementationGuide({
      hypothesis: hypothesis('MODEL_PORTFOLIO_REVIEW'),
      recommendationId: 'rec-1',
      organizationId: 'org-1',
      workload: 'classification',
      environment: 'production',
      expectedEconomicsEvidenceRef: 'benchmark:abc',
    });

    expect(guide.expectedEconomicsEvidenceRef).toBe('benchmark:abc');
    expect(guide.proposedChange).toBe('Test the approved candidate');
  });
});
