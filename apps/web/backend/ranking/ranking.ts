import {
  compare,
  divide,
  parseDecimal,
  rational,
  subtract,
  type Rational,
} from '../economics/exact.js';

export type EaseCategory =
  | 'CONFIGURATION_ONLY'
  | 'ISOLATED_CODE_CHANGE'
  | 'COORDINATED_MULTI_COMPONENT'
  | 'MIGRATION_ARCHITECTURE';

export type ConstraintSafetyInput = Readonly<{
  kind: 'MINIMUM' | 'MAXIMUM';
  measured: string;
  threshold: string;
  passed: boolean;
}>;

export type RankingInput = Readonly<{
  findingId: string;
  positiveNetMonthlySaving: string;
  organizationMaterialityTarget: string;
  confidence: number;
  ease: EaseCategory;
  tested: boolean;
  constraints: readonly ConstraintSafetyInput[];
}>;

export type RankedRecommendation = Readonly<{
  findingId: string;
  priority: number;
  savingsPotential: number;
  confidence: number;
  easeOfImplementation: number;
  performanceSafety: number;
  positiveNetMonthlySaving: string;
}>;

function rationalNumber(value: Rational): number {
  return Number(value.numerator) / Number(value.denominator);
}

function easeScore(ease: EaseCategory): number {
  switch (ease) {
    case 'CONFIGURATION_ONLY':
      return 1;
    case 'ISOLATED_CODE_CHANGE':
      return 0.75;
    case 'COORDINATED_MULTI_COMPONENT':
      return 0.5;
    case 'MIGRATION_ARCHITECTURE':
      return 0.25;
  }
}

function performanceSafety(input: RankingInput): number {
  if (!input.tested) return 0.25;
  if (input.constraints.some((constraint) => !constraint.passed)) return 0;
  if (input.constraints.length === 0) return 0.5;

  const scores = input.constraints.map((constraint) => {
    const threshold = parseDecimal(constraint.threshold);
    const measured = parseDecimal(constraint.measured);
    if (compare(threshold, rational(0n)) <= 0) return 0.5;

    const difference =
      constraint.kind === 'MINIMUM'
        ? subtract(measured, threshold)
        : subtract(threshold, measured);
    if (compare(difference, rational(0n)) <= 0) return 0.5;

    const margin = divide(difference, threshold);
    const normalized = Math.min(
      1,
      rationalNumber(divide(margin, rational(1n, 10n))),
    );
    return 0.5 + 0.5 * normalized;
  });

  return Math.min(...scores);
}

function savingsPotential(input: RankingInput): number {
  const saving = parseDecimal(input.positiveNetMonthlySaving);
  const target = parseDecimal(input.organizationMaterialityTarget);
  if (compare(target, rational(0n)) <= 0) {
    throw new Error('MATERIALITY_TARGET_MUST_BE_POSITIVE');
  }
  if (compare(saving, rational(0n)) <= 0) return 0;
  return Math.min(1, rationalNumber(divide(saving, target)));
}

export function rankRecommendations(
  inputs: readonly RankingInput[],
): readonly RankedRecommendation[] {
  const ranked = inputs.map((input) => {
    if (
      !Number.isFinite(input.confidence) ||
      input.confidence < 0 ||
      input.confidence > 1
    ) {
      throw new Error('CONFIDENCE_OUT_OF_RANGE');
    }

    const savingFactor = savingsPotential(input);
    const ease = easeScore(input.ease);
    const safety = performanceSafety(input);
    const priority = savingFactor * input.confidence * ease * safety;

    return Object.freeze({
      findingId: input.findingId,
      priority,
      savingsPotential: savingFactor,
      confidence: input.confidence,
      easeOfImplementation: ease,
      performanceSafety: safety,
      positiveNetMonthlySaving: input.positiveNetMonthlySaving,
    });
  });

  ranked.sort((a, b) => {
    if (a.priority !== b.priority) return b.priority - a.priority;
    const savingOrder = compare(
      parseDecimal(b.positiveNetMonthlySaving),
      parseDecimal(a.positiveNetMonthlySaving),
    );
    if (savingOrder !== 0) return savingOrder;
    if (a.confidence !== b.confidence) return b.confidence - a.confidence;
    return a.findingId.localeCompare(b.findingId);
  });

  return Object.freeze(ranked);
}
