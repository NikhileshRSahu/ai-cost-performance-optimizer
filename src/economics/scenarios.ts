import {
  compare,
  formatDecimal,
  multiply,
  parseDecimal,
  subtract,
  type Rational,
} from './exact.js';

export type ScenarioBand = Readonly<{
  low: string;
  base: string;
  high: string;
}>;

export type ScenarioKind =
  | 'PROMPT_CACHING'
  | 'MODEL_PORTFOLIO_REVIEW'
  | 'OUTPUT_BUDGET'
  | 'RETRY_POLICY';

export type ScenarioHorizon =
  | 'OBSERVED_PERIOD'
  | 'THIRTY_DAY_PROJECTION';

type ScenarioCommon = Readonly<{
  currency: string;
  horizon: ScenarioHorizon;
  evidenceRef: string;
  pricingRef: string | null;
  overlapGroup: string | null;
}>;

export type OpportunityScenarioInput =
  | (ScenarioCommon &
      Readonly<{
        kind: 'PROMPT_CACHING';
        eligibleRepeatedTokens: string | null;
        cachedTokenPriceDelta: string | null;
        additionalCacheReuse: ScenarioBand | null;
      }>)
  | (ScenarioCommon &
      Readonly<{
        kind: 'MODEL_PORTFOLIO_REVIEW';
        eligibleVolume: ScenarioBand | null;
        currentUnitCost: string | null;
        candidateUnitCost: string | null;
      }>)
  | (ScenarioCommon &
      Readonly<{
        kind: 'RETRY_POLICY';
        avoidableRetryVolume: ScenarioBand | null;
        averageRetryCost: string | null;
      }>)
  | (ScenarioCommon &
      Readonly<{
        kind: 'OUTPUT_BUDGET';
        avoidableOutputTokens: ScenarioBand | null;
        outputTokenPrice: string | null;
      }>);

export type ScenarioEvidence = Readonly<{
  kind: ScenarioKind;
  currency: string;
  horizon: ScenarioHorizon;
  range: ScenarioBand;
  formulaVersion: 'scenario-v1';
  formula: string;
  assumptions: Readonly<Record<string, string>>;
  evidenceRef: string;
  pricingRef: string | null;
  overlapGroup: string | null;
}>;

type ParsedBand = Readonly<{
  low: Rational;
  base: Rational;
  high: Rational;
}>;

const ZERO = parseDecimal('0');

function parseNonNegative(value: string): Rational {
  const parsed = parseDecimal(value);
  if (compare(parsed, ZERO) < 0) {
    throw new Error('INVALID_SCENARIO_ASSUMPTION');
  }
  return parsed;
}

function parseBand(band: ScenarioBand): ParsedBand {
  const parsed = Object.freeze({
    low: parseNonNegative(band.low),
    base: parseNonNegative(band.base),
    high: parseNonNegative(band.high),
  });

  if (
    compare(parsed.low, parsed.base) > 0 ||
    compare(parsed.base, parsed.high) > 0
  ) {
    throw new Error('INVALID_SCENARIO_BAND');
  }

  return parsed;
}

function formattedRange(
  low: Rational,
  base: Rational,
  high: Rational,
): ScenarioBand {
  return Object.freeze({
    low: formatDecimal(low, 2),
    base: formatDecimal(base, 2),
    high: formatDecimal(high, 2),
  });
}

function evidence(
  input: ScenarioCommon,
  kind: ScenarioKind,
  range: ScenarioBand,
  formula: string,
  assumptions: Readonly<Record<string, string>>,
): ScenarioEvidence {
  return Object.freeze({
    kind,
    currency: input.currency,
    horizon: input.horizon,
    range,
    formulaVersion: 'scenario-v1',
    formula,
    assumptions: Object.freeze({ ...assumptions }),
    evidenceRef: input.evidenceRef,
    pricingRef: input.pricingRef,
    overlapGroup: input.overlapGroup,
  });
}

function multiplyBand(band: ParsedBand, factor: Rational): ScenarioBand {
  return formattedRange(
    multiply(band.low, factor),
    multiply(band.base, factor),
    multiply(band.high, factor),
  );
}

export function modelOpportunityScenario(
  input: OpportunityScenarioInput,
): ScenarioEvidence | null {
  switch (input.kind) {
    case 'PROMPT_CACHING': {
      if (
        input.eligibleRepeatedTokens === null ||
        input.cachedTokenPriceDelta === null ||
        input.additionalCacheReuse === null
      ) {
        return null;
      }

      const eligibleRepeatedTokens = parseNonNegative(
        input.eligibleRepeatedTokens,
      );
      const cachedTokenPriceDelta = parseNonNegative(
        input.cachedTokenPriceDelta,
      );
      const additionalCacheReuse = parseBand(input.additionalCacheReuse);
      const factor = multiply(eligibleRepeatedTokens, cachedTokenPriceDelta);

      return evidence(
        input,
        input.kind,
        multiplyBand(additionalCacheReuse, factor),
        'eligibleRepeatedTokens * additionalCacheReuse * cachedTokenPriceDelta',
        {
          additionalCacheReuseLow: input.additionalCacheReuse.low,
          additionalCacheReuseBase: input.additionalCacheReuse.base,
          additionalCacheReuseHigh: input.additionalCacheReuse.high,
        },
      );
    }

    case 'MODEL_PORTFOLIO_REVIEW': {
      if (
        input.eligibleVolume === null ||
        input.currentUnitCost === null ||
        input.candidateUnitCost === null
      ) {
        return null;
      }

      const eligibleVolume = parseBand(input.eligibleVolume);
      const currentUnitCost = parseNonNegative(input.currentUnitCost);
      const candidateUnitCost = parseNonNegative(input.candidateUnitCost);
      const unitCostSaving = subtract(currentUnitCost, candidateUnitCost);
      if (compare(unitCostSaving, ZERO) <= 0) return null;

      return evidence(
        input,
        input.kind,
        multiplyBand(eligibleVolume, unitCostSaving),
        'eligibleVolume * (currentUnitCost - candidateUnitCost)',
        {
          eligibleVolumeLow: input.eligibleVolume.low,
          eligibleVolumeBase: input.eligibleVolume.base,
          eligibleVolumeHigh: input.eligibleVolume.high,
        },
      );
    }

    case 'RETRY_POLICY': {
      if (
        input.avoidableRetryVolume === null ||
        input.averageRetryCost === null
      ) {
        return null;
      }

      const avoidableRetryVolume = parseBand(input.avoidableRetryVolume);
      const averageRetryCost = parseNonNegative(input.averageRetryCost);

      return evidence(
        input,
        input.kind,
        multiplyBand(avoidableRetryVolume, averageRetryCost),
        'avoidableRetryVolume * averageRetryCost',
        {
          avoidableRetryVolumeLow: input.avoidableRetryVolume.low,
          avoidableRetryVolumeBase: input.avoidableRetryVolume.base,
          avoidableRetryVolumeHigh: input.avoidableRetryVolume.high,
        },
      );
    }

    case 'OUTPUT_BUDGET': {
      if (
        input.avoidableOutputTokens === null ||
        input.outputTokenPrice === null
      ) {
        return null;
      }

      const avoidableOutputTokens = parseBand(input.avoidableOutputTokens);
      const outputTokenPrice = parseNonNegative(input.outputTokenPrice);

      return evidence(
        input,
        input.kind,
        multiplyBand(avoidableOutputTokens, outputTokenPrice),
        'avoidableOutputTokens * outputTokenPrice',
        {
          avoidableOutputTokensLow: input.avoidableOutputTokens.low,
          avoidableOutputTokensBase: input.avoidableOutputTokens.base,
          avoidableOutputTokensHigh: input.avoidableOutputTokens.high,
        },
      );
    }
  }
}
