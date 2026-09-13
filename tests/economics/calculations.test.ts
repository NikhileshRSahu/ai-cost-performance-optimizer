import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';

import {
  costPerUnit,
  counterfactualImpact,
  netSavings,
  paybackMonths,
  projectThirtyDays,
  savingsPercentage,
} from '../../src/economics/calculations.js';

describe('validated economics calculations', () => {
  it('keeps a one-third unit cost exact', () => {
    expect(
      costPerUnit({ totalCost: '1', units: '3', currency: 'USD' }).value,
    ).toEqual({ numerator: '1', denominator: '3' });
  });

  it('reports zero and missing unit denominators precisely', () => {
    expect(
      costPerUnit({ totalCost: '1', units: '0', currency: 'USD' })
        .unavailableReason,
    ).toBe('ZERO_DENOMINATOR');
    expect(
      costPerUnit({ totalCost: '1', units: null, currency: 'USD' })
        .unavailableReason,
    ).toBe('MISSING_DENOMINATOR');
  });

  it('accepts exact counts beyond the safe integer range up to 26 digits', () => {
    expect(
      costPerUnit({
        totalCost: '1',
        units: '99999999999999999999999999',
        currency: 'USD',
      }).value,
    ).toEqual({ numerator: '1', denominator: '99999999999999999999999999' });
  });

  it('projects seven supplied coverage days to thirty days', () => {
    expect(
      projectThirtyDays({
        observedCost: '70',
        coveredDays: '7',
        currency: 'USD',
      }).value,
    ).toEqual({ numerator: '300', denominator: '1' });
  });

  it('does not invent a monthly projection from six days', () => {
    expect(
      projectThirtyDays({
        observedCost: '60',
        coveredDays: '6',
        currency: 'USD',
      }).unavailableReason,
    ).toBe('INSUFFICIENT_COVERAGE');
  });

  it('subtracts both costs without hiding a loss', () => {
    const result = netSavings({
      baselineCost: '100',
      candidateCost: '120',
      implementationCost: '10',
      operatingCost: '5',
      currency: 'USD',
      horizon: 'first month',
    });
    expect(result.value).toEqual({ numerator: '-35', denominator: '1' });
    expect(result.inputs.horizon).toBe('first month');
  });

  it('returns an exact signed percentage and rejects a zero baseline', () => {
    expect(
      savingsPercentage({
        netSaving: '-35',
        baselineCost: '100',
        currency: 'USD',
      }).value,
    ).toEqual({ numerator: '-35', denominator: '1' });
    expect(
      savingsPercentage({ netSaving: '1', baselineCost: '0', currency: 'USD' })
        .unavailableReason,
    ).toBe('ZERO_DENOMINATOR');
  });

  it('calculates payback only for positive recurring savings', () => {
    expect(
      paybackMonths({
        implementationCost: '100',
        recurringMonthlyNetSaving: '25',
        currency: 'USD',
      }).value,
    ).toEqual({ numerator: '4', denominator: '1' });
    for (const recurringMonthlyNetSaving of ['0', '-1']) {
      expect(
        paybackMonths({
          implementationCost: '100',
          recurringMonthlyNetSaving,
          currency: 'USD',
        }).unavailableReason,
      ).toBe('NON_POSITIVE_RECURRING_SAVING');
    }
  });

  it('scales baseline volume before subtracting actual incurred costs', () => {
    const result = counterfactualImpact({
      baselineCost: '1',
      baselineUnits: '3',
      postUnits: '3',
      actualPostCost: '0.5',
      implementationCost: '0.1',
      operatingCost: '0.05',
      currency: 'USD',
      horizon: '2026-09-01/2026-09-08',
    });
    expect(result.value).toEqual({ numerator: '7', denominator: '20' });
  });

  it('prioritizes zero baseline units over missing post units', () => {
    expect(
      counterfactualImpact({
        baselineCost: '1',
        baselineUnits: '0',
        postUnits: null,
        actualPostCost: '0.5',
        implementationCost: '0.1',
        operatingCost: '0.05',
        currency: 'USD',
        horizon: 'week',
      }).unavailableReason,
    ).toBe('ZERO_DENOMINATOR');
    expect(
      counterfactualImpact({
        baselineCost: '1',
        baselineUnits: '3',
        postUnits: null,
        actualPostCost: '0.5',
        implementationCost: '0.1',
        operatingCost: '0.05',
        currency: 'USD',
        horizon: 'week',
      }).unavailableReason,
    ).toBe('MISSING_DENOMINATOR');
  });

  it('allows zero post units and preserves the resulting cost increase', () => {
    expect(
      counterfactualImpact({
        baselineCost: '1',
        baselineUnits: '3',
        postUnits: '0',
        actualPostCost: '0.5',
        implementationCost: '0.1',
        operatingCost: '0.05',
        currency: 'USD',
        horizon: 'week',
      }).value,
    ).toEqual({ numerator: '-13', denominator: '20' });
  });

  it.each([
    [
      'costPerUnit',
      () =>
        costPerUnit({
          totalCost: '1',
          units: '1',
          currency: 'USD',
          extra: true,
        }),
    ],
    [
      'projectThirtyDays',
      () =>
        projectThirtyDays({
          observedCost: '7',
          coveredDays: '7',
          currency: 'USD',
          extra: true,
        }),
    ],
    [
      'netSavings',
      () =>
        netSavings({
          baselineCost: '2',
          candidateCost: '1',
          implementationCost: '0',
          operatingCost: '0',
          currency: 'USD',
          horizon: 'month',
          extra: true,
        }),
    ],
    [
      'savingsPercentage',
      () =>
        savingsPercentage({
          netSaving: '1',
          baselineCost: '2',
          currency: 'USD',
          extra: true,
        }),
    ],
    [
      'paybackMonths',
      () =>
        paybackMonths({
          implementationCost: '1',
          recurringMonthlyNetSaving: '1',
          currency: 'USD',
          extra: true,
        }),
    ],
    [
      'counterfactualImpact',
      () =>
        counterfactualImpact({
          baselineCost: '1',
          baselineUnits: '1',
          postUnits: '1',
          actualPostCost: '0',
          implementationCost: '0',
          operatingCost: '0',
          currency: 'USD',
          horizon: 'week',
          extra: true,
        }),
    ],
  ])('rejects unknown properties at the %s boundary', (_name, call) => {
    expect(call).toThrow(ZodError);
  });

  it.each([
    [
      'numeric money',
      () => costPerUnit({ totalCost: 1, units: '1', currency: 'USD' }),
    ],
    [
      'NaN money',
      () => costPerUnit({ totalCost: Number.NaN, units: '1', currency: 'USD' }),
    ],
    [
      'negative source money',
      () => costPerUnit({ totalCost: '-1', units: '1', currency: 'USD' }),
    ],
    [
      'source scale 13',
      () =>
        costPerUnit({
          totalCost: '0.1234567890123',
          units: '1',
          currency: 'USD',
        }),
    ],
    [
      'source integer precision 27',
      () =>
        netSavings({
          baselineCost: '100000000000000000000000000',
          candidateCost: '1',
          implementationCost: '0',
          operatingCost: '0',
          currency: 'USD',
          horizon: 'month',
        }),
    ],
    [
      'numeric covered days',
      () =>
        projectThirtyDays({
          observedCost: '7',
          coveredDays: 7,
          currency: 'USD',
        }),
    ],
    [
      'negative count',
      () => costPerUnit({ totalCost: '1', units: '-1', currency: 'USD' }),
    ],
    [
      'count precision 27',
      () =>
        counterfactualImpact({
          baselineCost: '1',
          baselineUnits: '100000000000000000000000000',
          postUnits: '1',
          actualPostCost: '0',
          implementationCost: '0',
          operatingCost: '0',
          currency: 'USD',
          horizon: 'week',
        }),
    ],
    [
      'numeric signed net saving',
      () =>
        savingsPercentage({
          netSaving: -1,
          baselineCost: '2',
          currency: 'USD',
        }),
    ],
    [
      'numeric recurring saving',
      () =>
        paybackMonths({
          implementationCost: '2',
          recurringMonthlyNetSaving: 1,
          currency: 'USD',
        }),
    ],
    [
      'lowercase currency',
      () => costPerUnit({ totalCost: '1', units: '1', currency: 'usd' }),
    ],
    [
      'unsupported currency',
      () => costPerUnit({ totalCost: '1', units: '1', currency: 'ZZZ' }),
    ],
  ])('rejects %s', (_name, call) => {
    expect(call).toThrow(ZodError);
  });

  it.each([
    [
      'netSavings',
      () =>
        netSavings({
          baselineCost: '2',
          candidateCost: '1',
          implementationCost: '0',
          operatingCost: '0',
          currency: 'USD',
          horizon: 'x'.repeat(201),
        }),
    ],
    [
      'counterfactualImpact',
      () =>
        counterfactualImpact({
          baselineCost: '1',
          baselineUnits: '1',
          postUnits: '1',
          actualPostCost: '0',
          implementationCost: '0',
          operatingCost: '0',
          currency: 'USD',
          horizon: 'x'.repeat(201),
        }),
    ],
  ])('rejects overlong horizons at the %s boundary', (_name, call) => {
    expect(call).toThrow(ZodError);
  });

  it('rejects an empty trimmed net-impact horizon', () => {
    expect(() =>
      netSavings({
        baselineCost: '1',
        candidateCost: '1',
        implementationCost: '0',
        operatingCost: '0',
        currency: 'USD',
        horizon: '   ',
      }),
    ).toThrow(ZodError);
  });

  it('permits signed values only in the two declared inputs', () => {
    expect(() =>
      netSavings({
        baselineCost: '-1',
        candidateCost: '1',
        implementationCost: '0',
        operatingCost: '0',
        currency: 'USD',
        horizon: 'month',
      }),
    ).toThrow();
    expect(
      savingsPercentage({ netSaving: '-1', baselineCost: '2', currency: 'USD' })
        .value,
    ).toEqual({ numerator: '-50', denominator: '1' });
    expect(
      paybackMonths({
        implementationCost: '2',
        recurringMonthlyNetSaving: '-1',
        currency: 'USD',
      }).unavailableReason,
    ).toBe('NON_POSITIVE_RECURRING_SAVING');
  });

  it('returns stable JSON-safe deeply frozen calculation evidence without a savings state', () => {
    const result = netSavings({
      baselineCost: '100.00',
      candidateCost: '80',
      implementationCost: '5',
      operatingCost: '2',
      currency: 'USD',
      horizon: '  first month  ',
    });
    expect(result.formulaVersion).toBe('economics-v1');
    expect(result.formula).toBe(
      'baselineCost - candidateCost - implementationCost - operatingCost',
    );
    expect(result.inputs).toEqual({
      baselineCost: '100.00',
      candidateCost: '80',
      implementationCost: '5',
      operatingCost: '2',
      currency: 'USD',
      horizon: 'first month',
    });
    expect('savingsState' in result).toBe(false);
    expect(() => JSON.stringify(result)).not.toThrow();
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.inputs)).toBe(true);
    expect(Object.isFrozen(result.value)).toBe(true);
  });
});
