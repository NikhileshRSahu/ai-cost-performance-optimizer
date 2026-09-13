import { describe, expect, it } from 'vitest';
import {
  appendState,
  currentValidState,
  type LedgerEvent,
} from '../../src/ledger/ledger.js';

function stateEvent(
  id: string,
  state: 'OPPORTUNITY' | 'TESTED' | 'VERIFIED',
  organizationId = 'org-1',
): LedgerEvent {
  return {
    id,
    recommendationId: 'rec-1',
    organizationId,
    type: 'STATE_RECORDED',
    state,
    occurredAt: `2026-09-13T00:00:0${String(id.length)}Z`,
    evidenceRef: `evidence-${id}`,
    reason: null,
    invalidatesEventId: null,
  };
}

describe('savings-state ledger', () => {
  it('allows only the forward OPPORTUNITY to TESTED to VERIFIED path', () => {
    let history = appendState({
      history: [],
      event: stateEvent('a', 'OPPORTUNITY'),
    });
    history = appendState({ history, event: stateEvent('bb', 'TESTED') });
    history = appendState({ history, event: stateEvent('ccc', 'VERIFIED') });
    expect(currentValidState(history, 'org-1', 'rec-1')).toBe('VERIFIED');
    expect(() =>
      appendState({ history: [], event: stateEvent('x', 'TESTED') }),
    ).toThrow('INVALID_INITIAL_SAVINGS_STATE');
    expect(() =>
      appendState({ history, event: stateEvent('dddd', 'TESTED') }),
    ).toThrow('INVALID_SAVINGS_STATE_TRANSITION');
  });

  it('isolates identical recommendation IDs by organization', () => {
    const orgOne = appendState({
      history: [],
      event: stateEvent('a', 'OPPORTUNITY', 'org-1'),
    });
    const history = appendState({
      history: orgOne,
      event: stateEvent('bb', 'OPPORTUNITY', 'org-2'),
    });

    expect(currentValidState(history, 'org-1', 'rec-1')).toBe('OPPORTUNITY');
    expect(currentValidState(history, 'org-2', 'rec-1')).toBe('OPPORTUNITY');
  });

  it('rejects duplicate event IDs', () => {
    const history = appendState({
      history: [],
      event: stateEvent('a', 'OPPORTUNITY'),
    });
    expect(() =>
      appendState({ history, event: stateEvent('a', 'TESTED') }),
    ).toThrow('DUPLICATE_LEDGER_EVENT_ID');
  });

  it('invalidates evidence append-only and recomputes the current valid state', () => {
    let history = appendState({
      history: [],
      event: stateEvent('a', 'OPPORTUNITY'),
    });
    history = appendState({ history, event: stateEvent('bb', 'TESTED') });
    const invalidation: LedgerEvent = {
      id: 'invalidate-b',
      recommendationId: 'rec-1',
      organizationId: 'org-1',
      type: 'STATE_INVALIDATED',
      state: 'TESTED',
      occurredAt: '2026-09-13T01:00:00Z',
      evidenceRef: 'correction-1',
      reason: 'Benchmark evidence corrected',
      invalidatesEventId: 'bb',
    };
    const next = appendState({ history, event: invalidation });
    expect(next).toHaveLength(3);
    expect(next[1]?.type).toBe('STATE_RECORDED');
    expect(currentValidState(next, 'org-1', 'rec-1')).toBe('OPPORTUNITY');
  });

  it('rejects invalidation across recommendations', () => {
    const history = appendState({
      history: [],
      event: stateEvent('a', 'OPPORTUNITY'),
    });
    const invalidation: LedgerEvent = {
      id: 'inv',
      recommendationId: 'rec-other',
      organizationId: 'org-1',
      type: 'STATE_INVALIDATED',
      state: 'OPPORTUNITY',
      occurredAt: '2026-09-13T01:00:00Z',
      evidenceRef: 'correction',
      reason: 'wrong target',
      invalidatesEventId: 'a',
    };
    expect(() => appendState({ history, event: invalidation })).toThrow(
      'INVALID_INVALIDATION_TARGET',
    );
  });
});
