import { describe, expect, it } from 'vitest';
import { nonOverlappingScenarioTotal } from '../../src/economics/scenario-overlap.js';

function scenario(
  recommendationId: string,
  low: string,
  base: string,
  high: string,
  overlapGroup: string | null,
  currency = 'USD',
  horizon: 'OBSERVED_PERIOD' | 'THIRTY_DAY_PROJECTION' = 'OBSERVED_PERIOD',
) {
  return {
    recommendationId,
    range: { low, base, high },
    overlapGroup,
    currency,
    horizon,
  } as const;
}

describe('nonOverlappingScenarioTotal', () => {
  it('adds independent scenarios', () => {
    expect(
      nonOverlappingScenarioTotal([
        scenario('a', '10', '20', '30', null),
        scenario('b', '5', '10', '15', null),
      ]),
    ).toEqual({ low: '15.00', base: '30.00', high: '45.00' });
  });

  it('counts only the highest conservative scenario inside one overlap group', () => {
    expect(
      nonOverlappingScenarioTotal([
        scenario('cache', '20', '30', '40', 'tokens:support'),
        scenario('prompt', '25', '28', '31', 'tokens:support'),
      ]),
    ).toEqual({ low: '25.00', base: '28.00', high: '31.00' });
  });

  it('breaks equal-low overlap ties deterministically by recommendation id', () => {
    expect(
      nonOverlappingScenarioTotal([
        scenario('z-rec', '20', '50', '80', 'shared'),
        scenario('a-rec', '20', '30', '40', 'shared'),
      ]),
    ).toEqual({ low: '20.00', base: '30.00', high: '40.00' });
  });

  it('returns null for no modeled scenarios', () => {
    expect(nonOverlappingScenarioTotal([])).toBeNull();
  });

  it('is order independent', () => {
    const first = [
      scenario('a', '10', '20', '30', null),
      scenario('b', '20', '25', '30', 'shared'),
      scenario('c', '25', '26', '27', 'shared'),
    ] as const;
    const second = [...first].reverse();

    expect(nonOverlappingScenarioTotal(first)).toEqual(
      nonOverlappingScenarioTotal(second),
    );
  });

  it('rejects totals across different currencies', () => {
    expect(() =>
      nonOverlappingScenarioTotal([
        scenario('usd', '10', '20', '30', null, 'USD'),
        scenario('eur', '10', '20', '30', null, 'EUR'),
      ]),
    ).toThrowError('MIXED_SCENARIO_CURRENCY');
  });

  it('rejects totals across different horizons', () => {
    expect(() =>
      nonOverlappingScenarioTotal([
        scenario('observed', '10', '20', '30', null),
        scenario(
          'projected',
          '10',
          '20',
          '30',
          null,
          'USD',
          'THIRTY_DAY_PROJECTION',
        ),
      ]),
    ).toThrowError('MIXED_SCENARIO_HORIZON');
  });
});
