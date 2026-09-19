export type SavingsState = 'OPPORTUNITY' | 'TESTED' | 'VERIFIED';
export type LedgerEventType = 'STATE_RECORDED' | 'STATE_INVALIDATED';

export type LedgerEvent = Readonly<{
  id: string;
  recommendationId: string;
  organizationId: string;
  type: LedgerEventType;
  state: SavingsState;
  occurredAt: string;
  evidenceRef: string;
  reason: string | null;
  invalidatesEventId: string | null;
}>;

const forwardState: Readonly<Record<SavingsState, SavingsState | null>> = {
  OPPORTUNITY: 'TESTED',
  TESTED: 'VERIFIED',
  VERIFIED: null,
};

function invalidatedIds(history: readonly LedgerEvent[]): ReadonlySet<string> {
  return new Set(
    history
      .filter((event) => event.type === 'STATE_INVALIDATED')
      .map((event) => event.invalidatesEventId)
      .filter((id): id is string => id !== null),
  );
}

export function currentValidState(
  history: readonly LedgerEvent[],
  organizationId: string,
  recommendationId: string,
): SavingsState | null {
  const invalidated = invalidatedIds(history);
  const current = [...history]
    .reverse()
    .find(
      (event) =>
        event.organizationId === organizationId &&
        event.recommendationId === recommendationId &&
        event.type === 'STATE_RECORDED' &&
        !invalidated.has(event.id),
    );
  return current?.state ?? null;
}

export function appendState(
  input: Readonly<{
    history: readonly LedgerEvent[];
    event: LedgerEvent;
  }>,
): readonly LedgerEvent[] {
  if (input.history.some((event) => event.id === input.event.id)) {
    throw new Error('DUPLICATE_LEDGER_EVENT_ID');
  }

  if (input.event.type === 'STATE_INVALIDATED') {
    if (input.event.invalidatesEventId === null) {
      throw new Error('INVALID_INVALIDATION_TARGET');
    }
    const target = input.history.find(
      (event) => event.id === input.event.invalidatesEventId,
    );
    const alreadyInvalidated = invalidatedIds(input.history).has(
      input.event.invalidatesEventId,
    );
    if (
      target === undefined ||
      target.type !== 'STATE_RECORDED' ||
      target.organizationId !== input.event.organizationId ||
      target.recommendationId !== input.event.recommendationId ||
      target.state !== input.event.state ||
      alreadyInvalidated
    ) {
      throw new Error('INVALID_INVALIDATION_TARGET');
    }
    if (input.event.reason === null || input.event.reason.trim().length === 0) {
      throw new Error('INVALIDATION_REASON_REQUIRED');
    }
  } else {
    if (input.event.invalidatesEventId !== null) {
      throw new Error('STATE_EVENT_CANNOT_INVALIDATE');
    }
    const current = currentValidState(
      input.history,
      input.event.organizationId,
      input.event.recommendationId,
    );
    if (current === null) {
      if (input.event.state !== 'OPPORTUNITY') {
        throw new Error('INVALID_INITIAL_SAVINGS_STATE');
      }
    } else if (forwardState[current] !== input.event.state) {
      throw new Error('INVALID_SAVINGS_STATE_TRANSITION');
    }
  }

  return Object.freeze([...input.history, Object.freeze({ ...input.event })]);
}
