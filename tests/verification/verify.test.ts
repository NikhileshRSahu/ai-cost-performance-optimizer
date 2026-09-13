import { describe, expect, it } from 'vitest';
import { verifyPostChange } from '../../src/verification/verify.js';

const completeDaysA = [
  '2026-09-01',
  '2026-09-02',
  '2026-09-03',
  '2026-09-04',
  '2026-09-05',
  '2026-09-06',
  '2026-09-07',
];
const completeDaysB = [
  '2026-09-15',
  '2026-09-16',
  '2026-09-17',
  '2026-09-18',
  '2026-09-19',
  '2026-09-20',
  '2026-09-21',
];

function validInput() {
  return {
    implementation: {
      recommendationId: 'rec-1',
      organizationId: 'org-1',
      implementedAt: '2026-09-08T00:00:00Z',
      rolloutStart: '2026-09-08T00:00:00Z',
      stabilizationEnd: '2026-09-14T23:59:59Z',
      deploymentNote: 'Canary stabilized before post window.',
      rollbackInstructions: ['restore prior config'],
      confirmedByUserId: 'operator-1',
    },
    baseline: {
      start: '2026-09-01T00:00:00Z',
      end: '2026-09-08T00:00:00Z',
      completeDays: completeDaysA,
      workload: 'classification',
      configurationVersion: 'model-a-v1',
      currency: 'USD',
      denominator: 'REQUESTS',
      attributionScope: 'workload:classification',
      unitDefinition: 'one accepted API request',
      successDefinition: null,
      cost: '1',
      units: '3',
    },
    post: {
      start: '2026-09-15T00:00:00Z',
      end: '2026-09-22T00:00:00Z',
      completeDays: completeDaysB,
      workload: 'classification',
      configurationVersion: 'model-b-v1',
      currency: 'USD',
      denominator: 'REQUESTS',
      attributionScope: 'workload:classification',
      unitDefinition: 'one accepted API request',
      successDefinition: null,
      actualCost: '0.5',
      units: '3',
      qualityEvidence: {
        measured: '0.93',
        requiredMinimum: '0.9',
        p95LatencyMs: '90',
        maxP95LatencyMs: '100',
        failureRate: '0.01',
        maxFailureRate: '0.02',
        sourceRef: 'post-quality-1',
      },
    },
    implementationCostInWindow: '0.1',
    incrementalOperatingCost: '0.05',
    attestations: {
      unitDefinitionUnchanged: true,
      workloadMixComparable: true,
      concurrentDeploymentsResolved: true,
    },
  } as const;
}

describe('post-change verification', () => {
  it('produces exact verified net impact only when all gates pass', () => {
    const result = verifyPostChange(validInput());
    expect(result).toEqual({
      status: 'VERIFIED',
      reasons: [],
      netImpact: { numerator: '7', denominator: '20' },
      direction: 'SAVING',
      formulaVersion: 'economics-v1',
    });
  });

  it('keeps a verified negative impact visible as a cost increase', () => {
    const input = validInput();
    const result = verifyPostChange({
      ...input,
      post: { ...input.post, actualCost: '2' },
    });
    expect(result.status).toBe('VERIFIED');
    expect(result.direction).toBe('COST_INCREASE');
    expect(result.netImpact).toEqual({ numerator: '-23', denominator: '20' });
  });

  it.each([
    ['BASELINE_COVERAGE_INSUFFICIENT', (input: ReturnType<typeof validInput>) => ({ ...input, baseline: { ...input.baseline, completeDays: completeDaysA.slice(0, 6) } })],
    ['POST_COVERAGE_INSUFFICIENT', (input: ReturnType<typeof validInput>) => ({ ...input, post: { ...input.post, completeDays: completeDaysB.slice(0, 6) } })],
    ['WINDOWS_OVERLAP', (input: ReturnType<typeof validInput>) => ({ ...input, post: { ...input.post, start: '2026-09-07T00:00:00Z' } })],
    ['WORKLOAD_MISMATCH', (input: ReturnType<typeof validInput>) => ({ ...input, post: { ...input.post, workload: 'support' } })],
    ['CURRENCY_MISMATCH', (input: ReturnType<typeof validInput>) => ({ ...input, post: { ...input.post, currency: 'EUR' } })],
    ['DENOMINATOR_MISMATCH', (input: ReturnType<typeof validInput>) => ({ ...input, post: { ...input.post, denominator: 'SUCCESSFUL_OUTCOMES' } })],
    ['ATTRIBUTION_SCOPE_MISMATCH', (input: ReturnType<typeof validInput>) => ({ ...input, post: { ...input.post, attributionScope: 'project:other' } })],
    ['UNIT_DEFINITION_CHANGED', (input: ReturnType<typeof validInput>) => ({ ...input, attestations: { ...input.attestations, unitDefinitionUnchanged: false } })],
    ['WORKLOAD_MIX_NOT_COMPARABLE', (input: ReturnType<typeof validInput>) => ({ ...input, attestations: { ...input.attestations, workloadMixComparable: false } })],
    ['CONCURRENT_DEPLOYMENT_UNRESOLVED', (input: ReturnType<typeof validInput>) => ({ ...input, attestations: { ...input.attestations, concurrentDeploymentsResolved: false } })],
    ['POST_QUALITY_EVIDENCE_REQUIRED', (input: ReturnType<typeof validInput>) => ({ ...input, post: { ...input.post, qualityEvidence: null } })],
    ['BASELINE_UNITS_MISSING_OR_ZERO', (input: ReturnType<typeof validInput>) => ({ ...input, baseline: { ...input.baseline, units: '0' } })],
    ['POST_UNITS_MISSING', (input: ReturnType<typeof validInput>) => ({ ...input, post: { ...input.post, units: null } })],
  ])('blocks verification for %s', (reason, mutate) => {
    const result = verifyPostChange(mutate(validInput()));
    expect(result.status).toBe('BLOCKED');
    expect(result.reasons).toContain(reason);
    expect(result.netImpact).toBeNull();
  });

  it('blocks a post window that intersects rollout or stabilization', () => {
    const input = validInput();
    const result = verifyPostChange({
      ...input,
      post: {
        ...input.post,
        start: '2026-09-14T12:00:00Z',
      },
    });
    expect(result.reasons).toContain('ROLLOUT_OR_STABILIZATION_OVERLAP');
  });

  it('blocks when post-change performance fails configured constraints', () => {
    const input = validInput();
    const result = verifyPostChange({
      ...input,
      post: {
        ...input.post,
        qualityEvidence: {
          ...input.post.qualityEvidence,
          measured: '0.89',
        },
      },
    });
    expect(result.reasons).toContain('PERFORMANCE_CONSTRAINT_FAILED');
  });
});
