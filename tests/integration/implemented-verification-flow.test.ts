import { describe, expect, it } from 'vitest';
import { createImplementationRecord } from '../../src/implementation/records.js';
import {
  appendState,
  currentValidState,
  type LedgerEvent,
} from '../../src/ledger/ledger.js';
import { verifyPostChange } from '../../src/verification/verify.js';
import {
  authorize,
  type AuthenticatedSession,
} from '../../src/workbench/authz.js';

const baselineDays = [
  '2026-09-01',
  '2026-09-02',
  '2026-09-03',
  '2026-09-04',
  '2026-09-05',
  '2026-09-06',
  '2026-09-07',
];
const postDays = [
  '2026-09-15',
  '2026-09-16',
  '2026-09-17',
  '2026-09-18',
  '2026-09-19',
  '2026-09-20',
  '2026-09-21',
];

function stateEvent(
  id: string,
  state: 'OPPORTUNITY' | 'TESTED' | 'VERIFIED',
  evidenceRef: string,
): LedgerEvent {
  return {
    id,
    recommendationId: 'rec-1',
    organizationId: 'org-1',
    type: 'STATE_RECORDED',
    state,
    occurredAt: '2026-09-13T10:00:00Z',
    evidenceRef,
    reason: null,
    invalidatesEventId: null,
  };
}

describe('implemented recommendation verification journey', () => {
  it('requires operator authority and exact comparable post-change evidence before VERIFIED', () => {
    const session: AuthenticatedSession = {
      userId: 'operator-1',
      memberships: [{ organizationId: 'org-1', role: 'OPERATOR' }],
    };

    let history = appendState({
      history: [],
      event: stateEvent('state-opportunity', 'OPPORTUNITY', 'finding-1'),
    });
    history = appendState({
      history,
      event: stateEvent('state-tested', 'TESTED', 'benchmark-1'),
    });

    const implementationAuthorization = authorize(
      session,
      'org-1',
      'MARK_IMPLEMENTED',
    );
    const implementation = createImplementationRecord({
      recommendationId: 'rec-1',
      organizationId: 'org-1',
      implementedAt: '2026-09-08T00:00:00Z',
      rolloutStart: '2026-09-08T00:00:00Z',
      stabilizationEnd: '2026-09-14T23:59:59Z',
      deploymentNote: 'Canary completed before post window.',
      rollbackInstructions: ['Restore model A configuration'],
      confirmedByUserId: session.userId,
      authorization: implementationAuthorization,
    });

    expect(authorize(session, 'org-1', 'SUBMIT_VERIFICATION').allowed).toBe(
      true,
    );

    const verification = verifyPostChange({
      implementation,
      baseline: {
        start: '2026-09-01T00:00:00Z',
        end: '2026-09-08T00:00:00Z',
        completeDays: baselineDays,
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
        completeDays: postDays,
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
    });

    expect(verification.status).toBe('VERIFIED');
    expect(verification.netImpact).toEqual({
      numerator: '7',
      denominator: '20',
    });

    history = appendState({
      history,
      event: stateEvent('state-verified', 'VERIFIED', 'verification-1'),
    });
    expect(currentValidState(history, 'rec-1')).toBe('VERIFIED');
  });

  it('keeps viewers unable to implement or submit verification evidence', () => {
    const viewer: AuthenticatedSession = {
      userId: 'viewer-1',
      memberships: [{ organizationId: 'org-1', role: 'VIEWER' }],
    };

    expect(authorize(viewer, 'org-1', 'MARK_IMPLEMENTED').allowed).toBe(false);
    expect(authorize(viewer, 'org-1', 'SUBMIT_VERIFICATION').allowed).toBe(
      false,
    );
  });
});
