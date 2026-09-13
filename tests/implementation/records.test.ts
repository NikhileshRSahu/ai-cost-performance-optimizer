import { describe, expect, it } from 'vitest';
import {
  createImplementationRecord,
  markGuideReviewed,
  type ImplementationGuide,
} from '../../src/implementation/records.js';
import {
  authorize,
  type AuthenticatedSession,
} from '../../src/workbench/authz.js';

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

const operatorSession: AuthenticatedSession = {
  userId: 'user-operator',
  memberships: [{ organizationId: 'org-1', role: 'OPERATOR' }],
};

describe('implementation evidence records', () => {
  it('marks a complete guide reviewed only after authorized operator evidence', () => {
    const reviewed = markGuideReviewed({
      guide,
      authorization: authorize(
        operatorSession,
        'org-1',
        'PREPARE_GUIDE',
      ),
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
          organizationId: 'org-1',
          reason: 'ACTION_NOT_ALLOWED',
        },
        userId: 'viewer',
        reviewedAt: '2026-09-13T10:00:00Z',
      }),
    ).toThrow('AUTHORIZED_OPERATOR_REQUIRED');

    expect(() =>
      markGuideReviewed({
        guide: { ...guide, rolloutSteps: [] },
        authorization: {
          allowed: true,
          role: 'OWNER',
          organizationId: 'org-1',
          reason: null,
        },
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
      authorization: authorize(
        operatorSession,
        'org-1',
        'MARK_IMPLEMENTED',
      ),
    });
    expect(record.stabilizationEnd).toBe('2026-09-14T11:00:00Z');
    expect(record.rollbackInstructions).toEqual([
      'Restore model A configuration',
    ]);
  });

  it('rejects authorization evidence issued for another organization', () => {
    const crossTenantAuthorization = authorize(
      operatorSession,
      'org-1',
      'MARK_IMPLEMENTED',
    );

    expect(() =>
      createImplementationRecord({
        recommendationId: 'rec-2',
        organizationId: 'org-2',
        implementedAt: '2026-09-13T11:00:00Z',
        rolloutStart: '2026-09-13T11:00:00Z',
        stabilizationEnd: '2026-09-14T11:00:00Z',
        deploymentNote: 'must not cross tenant boundary',
        rollbackInstructions: ['rollback'],
        confirmedByUserId: 'user-operator',
        authorization: crossTenantAuthorization,
      }),
    ).toThrow('AUTHORIZED_ORGANIZATION_MISMATCH');
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
        authorization: authorize(
          operatorSession,
          'org-1',
          'MARK_IMPLEMENTED',
        ),
      }),
    ).toThrow('INVALID_STABILIZATION_INTERVAL');
  });
});
