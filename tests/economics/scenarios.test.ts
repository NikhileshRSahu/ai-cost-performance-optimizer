import { describe, expect, it } from 'vitest';
import * as economics from '../../src/economics/index.js';

type ScenarioResult = Readonly<{
  kind: string;
  currency: string;
  horizon: 'OBSERVED_PERIOD' | 'THIRTY_DAY_PROJECTION';
  range: Readonly<{ low: string; base: string; high: string }>;
  formulaVersion: string;
  formula: string;
  assumptions: Readonly<Record<string, string>>;
  evidenceRef: string;
  pricingRef: string | null;
  overlapGroup: string | null;
}>;

function model(input: unknown): ScenarioResult | null {
  const candidate = (
    economics as unknown as {
      modelOpportunityScenario?: (value: unknown) => ScenarioResult | null;
    }
  ).modelOpportunityScenario;
  expect(candidate).toBeTypeOf('function');
  return candidate!(input);
}

const common = {
  currency: 'USD',
  horizon: 'OBSERVED_PERIOD' as const,
  evidenceRef: 'import:usage-1',
  pricingRef: 'pricing:provider-2026-09-17',
};

describe('modeled opportunity scenarios', () => {
  it('models prompt-caching savings from repeated tokens and cache-reuse assumptions', () => {
    const result = model({
      kind: 'PROMPT_CACHING',
      ...common,
      overlapGroup: 'input-token-efficiency',
      eligibleRepeatedTokens: '1000000',
      cachedTokenPriceDelta: '0.000002',
      additionalCacheReuse: { low: '0.20', base: '0.35', high: '0.50' },
    });

    expect(result).toMatchObject({
      kind: 'PROMPT_CACHING',
      range: { low: '0.40', base: '0.70', high: '1.00' },
      formulaVersion: 'scenario-v1',
      evidenceRef: 'import:usage-1',
      pricingRef: 'pricing:provider-2026-09-17',
      overlapGroup: 'input-token-efficiency',
    });
    expect(result?.formula).toBe(
      'eligibleRepeatedTokens * additionalCacheReuse * cachedTokenPriceDelta',
    );
    expect(result?.assumptions).toEqual({
      additionalCacheReuseLow: '0.20',
      additionalCacheReuseBase: '0.35',
      additionalCacheReuseHigh: '0.50',
    });
  });

  it('models cheaper-model savings from eligible volume and unit-cost difference', () => {
    const result = model({
      kind: 'MODEL_PORTFOLIO_REVIEW',
      ...common,
      overlapGroup: 'model-routing',
      eligibleVolume: { low: '1000', base: '1500', high: '2000' },
      currentUnitCost: '0.08',
      candidateUnitCost: '0.05',
    });

    expect(result?.range).toEqual({
      low: '30.00',
      base: '45.00',
      high: '60.00',
    });
    expect(result?.formula).toBe(
      'eligibleVolume * (currentUnitCost - candidateUnitCost)',
    );
  });

  it('models avoidable retry cost from explicit retry-volume assumptions', () => {
    const result = model({
      kind: 'RETRY_POLICY',
      ...common,
      overlapGroup: 'retry-cost',
      avoidableRetryVolume: { low: '100', base: '200', high: '300' },
      averageRetryCost: '0.04',
    });

    expect(result?.range).toEqual({
      low: '4.00',
      base: '8.00',
      high: '12.00',
    });
  });

  it('models avoidable output-token cost from explicit token assumptions', () => {
    const result = model({
      kind: 'OUTPUT_BUDGET',
      ...common,
      overlapGroup: 'output-token-efficiency',
      avoidableOutputTokens: {
        low: '100000',
        base: '200000',
        high: '300000',
      },
      outputTokenPrice: '0.00001',
    });

    expect(result?.range).toEqual({
      low: '1.00',
      base: '2.00',
      high: '3.00',
    });
  });

  it('withholds a scenario instead of inventing missing evidence or pricing', () => {
    expect(
      model({
        kind: 'PROMPT_CACHING',
        ...common,
        overlapGroup: null,
        eligibleRepeatedTokens: null,
        cachedTokenPriceDelta: '0.000002',
        additionalCacheReuse: { low: '0.20', base: '0.35', high: '0.50' },
      }),
    ).toBeNull();

    expect(
      model({
        kind: 'MODEL_PORTFOLIO_REVIEW',
        ...common,
        overlapGroup: null,
        eligibleVolume: { low: '1000', base: '1500', high: '2000' },
        currentUnitCost: '0.08',
        candidateUnitCost: null,
      }),
    ).toBeNull();
  });

  it('rejects negative assumptions and inverted low/base/high bands', () => {
    expect(() =>
      model({
        kind: 'RETRY_POLICY',
        ...common,
        overlapGroup: null,
        avoidableRetryVolume: { low: '-1', base: '2', high: '3' },
        averageRetryCost: '0.04',
      }),
    ).toThrow('INVALID_SCENARIO_ASSUMPTION');

    expect(() =>
      model({
        kind: 'OUTPUT_BUDGET',
        ...common,
        overlapGroup: null,
        avoidableOutputTokens: { low: '300', base: '200', high: '100' },
        outputTokenPrice: '0.00001',
      }),
    ).toThrow('INVALID_SCENARIO_BAND');
  });

  it('returns immutable JSON-safe evidence without promoting the savings state', () => {
    const result = model({
      kind: 'RETRY_POLICY',
      ...common,
      overlapGroup: null,
      avoidableRetryVolume: { low: '10', base: '20', high: '30' },
      averageRetryCost: '0.10',
    });

    expect(result).not.toBeNull();
    expect('state' in (result ?? {})).toBe(false);
    expect('savingsState' in (result ?? {})).toBe(false);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result?.range)).toBe(true);
    expect(Object.isFrozen(result?.assumptions)).toBe(true);
    expect(() => JSON.stringify(result)).not.toThrow();
  });
});
