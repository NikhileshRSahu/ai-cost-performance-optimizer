import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { currentValidState, type LedgerEvent } from '../../src/ledger/ledger.js';
import { createDatabase } from '../../src/persistence/database.js';
import { createEvidenceRepository } from '../../src/persistence/repositories/evidence.js';
import {
  implementationRecords,
  ledgerEvents,
  memberships,
  organizations,
  recommendations,
  users,
  verificationWindows,
} from '../../src/persistence/schema.js';
import type { AuthenticatedSession } from '../../src/workbench/authz.js';

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined) throw new Error('DATABASE_URL_REQUIRED_FOR_DB_TESTS');

const database = createDatabase(databaseUrl);
const repository = createEvidenceRepository(database.db);
const sessionA: AuthenticatedSession = {
  userId: 'user-a',
  memberships: [{ organizationId: 'org-a', role: 'OWNER' }],
};

function event(
  id: string,
  state: 'OPPORTUNITY' | 'TESTED' | 'VERIFIED',
): LedgerEvent {
  return {
    id,
    recommendationId: 'rec-shared',
    organizationId: 'org-a',
    type: 'STATE_RECORDED',
    state,
    occurredAt: `2026-09-13T00:00:0${id.length}Z`,
    evidenceRef: `evidence-${id}`,
    reason: null,
    invalidatesEventId: null,
  };
}

describe('persisted evidence repository', () => {
  beforeAll(async () => {
    await database.migrate();
  });

  beforeEach(async () => {
    await database.db.delete(verificationWindows);
    await database.db.delete(implementationRecords);
    await database.db.delete(ledgerEvents);
    await database.db.delete(recommendations);
    await database.db.delete(memberships);
    await database.db.delete(users);
    await database.db.delete(organizations);

    await database.db.insert(organizations).values([
      {
        id: 'org-a',
        name: 'Org A',
        reportingCurrency: 'USD',
        timezone: 'UTC',
        materialityTarget: '100',
      },
      {
        id: 'org-b',
        name: 'Org B',
        reportingCurrency: 'USD',
        timezone: 'UTC',
        materialityTarget: '100',
      },
    ]);
    await database.db.insert(users).values({
      id: 'user-a',
      email: 'a@example.test',
      authProvider: 'test',
      authSubject: 'a',
    });
    await database.db.insert(memberships).values({
      organizationId: 'org-a',
      userId: 'user-a',
      role: 'OWNER',
    });
    await database.db.insert(recommendations).values([
      {
        id: 'rec-shared',
        organizationId: 'org-a',
        decision: 'BENCHMARK',
        savingState: 'OPPORTUNITY',
        evidence: {},
      },
      {
        id: 'rec-shared',
        organizationId: 'org-b',
        decision: 'BENCHMARK',
        savingState: 'OPPORTUNITY',
        evidence: {},
      },
    ]);
  });

  afterAll(async () => {
    await database.close();
  });

  it('persists forward trust states and reconstructs current valid state', async () => {
    await repository.appendLedgerEvent(sessionA, event('a', 'OPPORTUNITY'));
    await repository.appendLedgerEvent(sessionA, event('bb', 'TESTED'));
    await repository.appendLedgerEvent(sessionA, event('ccc', 'VERIFIED'));

    const history = await repository.listLedgerEvents(
      sessionA,
      'org-a',
      'rec-shared',
    );
    expect(currentValidState(history, 'org-a', 'rec-shared')).toBe('VERIFIED');
  });

  it('rejects duplicate IDs and cross-tenant evidence writes', async () => {
    await repository.appendLedgerEvent(sessionA, event('a', 'OPPORTUNITY'));
    await expect(
      repository.appendLedgerEvent(sessionA, event('a', 'TESTED')),
    ).rejects.toThrow();

    await expect(
      repository.appendLedgerEvent(sessionA, {
        ...event('b', 'OPPORTUNITY'),
        organizationId: 'org-b',
      }),
    ).rejects.toThrow('ORGANIZATION_MEMBERSHIP_REQUIRED');
  });

  it('preserves invalidated evidence rows append-only', async () => {
    await repository.appendLedgerEvent(sessionA, event('a', 'OPPORTUNITY'));
    await repository.appendLedgerEvent(sessionA, event('bb', 'TESTED'));
    await repository.appendLedgerEvent(sessionA, {
      id: 'inv',
      recommendationId: 'rec-shared',
      organizationId: 'org-a',
      type: 'STATE_INVALIDATED',
      state: 'TESTED',
      occurredAt: '2026-09-13T01:00:00Z',
      evidenceRef: 'correction-1',
      reason: 'benchmark corrected',
      invalidatesEventId: 'bb',
    });

    const history = await repository.listLedgerEvents(
      sessionA,
      'org-a',
      'rec-shared',
    );
    expect(history).toHaveLength(3);
    expect(currentValidState(history, 'org-a', 'rec-shared')).toBe(
      'OPPORTUNITY',
    );
  });

  it('stores implementation and verification evidence only inside the tenant', async () => {
    await repository.saveImplementation(sessionA, {
      recommendationId: 'rec-shared',
      organizationId: 'org-a',
      implementedAt: '2026-09-13T11:00:00Z',
      rolloutStart: '2026-09-13T11:00:00Z',
      stabilizationEnd: '2026-09-14T11:00:00Z',
      deploymentNote: 'canary rollout',
      rollbackInstructions: ['restore old model'],
      confirmedByUserId: 'user-a',
    });

    await repository.saveVerification(sessionA, {
      id: 'verify-1',
      organizationId: 'org-a',
      recommendationId: 'rec-shared',
      status: 'VERIFIED',
      baselineStart: '2026-09-01T00:00:00Z',
      baselineEnd: '2026-09-08T00:00:00Z',
      postStart: '2026-09-15T00:00:00Z',
      postEnd: '2026-09-22T00:00:00Z',
      netImpactNumerator: '125',
      netImpactDenominator: '1',
      formulaVersion: 'counterfactual-v1',
      evidence: { source: 'post-change' },
    });

    await expect(
      repository.saveVerification(sessionA, {
        id: 'verify-b',
        organizationId: 'org-b',
        recommendationId: 'rec-shared',
        status: 'VERIFIED',
        baselineStart: '2026-09-01T00:00:00Z',
        baselineEnd: '2026-09-08T00:00:00Z',
        postStart: '2026-09-15T00:00:00Z',
        postEnd: '2026-09-22T00:00:00Z',
        netImpactNumerator: '999',
        netImpactDenominator: '1',
        formulaVersion: 'counterfactual-v1',
        evidence: {},
      }),
    ).rejects.toThrow('ORGANIZATION_MEMBERSHIP_REQUIRED');
  });
});
