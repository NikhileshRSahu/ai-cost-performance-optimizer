import { describe, expect, it } from 'vitest';
import {
  createImplementationRecord,
  markGuideReviewed,
  type ImplementationGuide,
} from '../../src/implementation/records.js';

const guide: ImplementationGuide = {
  recommendationId: 'rec-1',
  organizationId: 'org-1',
  proposedChange: 'Switch classification workload from model A to candidate B.',
  workload: 'classification',
  environment: 'production',
  prerequisites: ['Benchmark passed configured constraints'],
  rolloutSteps: ['Deploy to 10% traffic', 'Expand after stable metrics'],
  metricsToWatch: ['quality', 'p95 latency', 'failure rate', 'cost'],
  stopConditions: ['quality below 0.9'],
  rollbackInstructions: ['Restore model A configuration'],
  expectedEconomicsEvidenceRef: 'calc-tested-1',
  reviewedByOperatorUserId: null,
  reviewedAt: null,
};

describe('implementation evidence records', () => {
  it('marks a complete guide reviewed only after authorized operator evidence', () => {
    const reviewed = markGuideReviewed({
      guide,
      authorization: { allowed: true, role: 'OPERATOR', reason: null },
      userId: 'user-operator',
      reviewedAt: '2026-09-13T10:00:00Z',
    });
    expect(reviewed.reviewedByOperatorUserId).toBe('user-operator');
    expect(Object.isFrozen(reviewed)).toBe(true);
  });

  it('rejects viewer review and incomplete guides', () => {
    expect(() =>
      markGuideReviewed({
        guide,
        authorization: {
          allowed: false,
          role: 'VIEWER',
          reason: 'ACTION_NOT_ALLOWED',
        },
        userId: 'viewer',
        reviewedAt: '2026-09-13T10:00:00Z',
      }),
    ).toThrow('AUTHORIZED_OPERATOR_REQUIRED');

    expect(() =>
      markGuideReviewed({
        guide: { ...guide, rolloutSteps: [] },
        authorization: { allowed: true, role: 'OWNER', reason: null },
        userId: 'owner',
        reviewedAt: '2026-09-13T10:00:00Z',
      }),
    ).toThrow();
  });

  it('records implementation and rollout stabilization without applying the change', () => {
    const record = createImplementationRecord({
      recommendationId: 'rec-1',
      organizationId: 'org-1',
      implementedAt: '2026-09-13T11:00:00Z',
      rolloutStart: '2026-09-13T11:00:00Z',
      stabilizationEnd: '2026-09-14T11:00:00Z',
      deploymentNote: '10% canary expanded after stable quality.',
      rollbackInstructions: ['Restore model A configuration'],
      confirmedByUserId: 'user-operator',
      authorization: { allowed: true, role: 'OPERATOR', reason: null },
    });
    expect(record.stabilizationEnd).toBe('2026-09-14T11:00:00Z');
    expect(record.rollbackInstructions).toEqual([
      'Restore model A configuration',
    ]);
  });

  it('rejects invalid stabilization ordering', () => {
    expect(() =>
      createImplementationRecord({
        recommendationId: 'rec-1',
        organizationId: 'org-1',
        implementedAt: '2026-09-13T11:00:00Z',
        rolloutStart: '2026-09-14T11:00:00Z',
        stabilizationEnd: '2026-09-13T11:00:00Z',
        deploymentNote: 'invalid',
        rollbackInstructions: ['rollback'],
        confirmedByUserId: 'user-operator',
        authorization: { allowed: true, role: 'OPERATOR', reason: null },
      }),
    ).toThrow('INVALID_STABILIZATION_INTERVAL');
  });
});
