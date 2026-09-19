import {
  compare,
  divide,
  multiply,
  parseDecimal,
  rational,
  serialize,
  subtract,
  type Rational,
} from './exact.js';
import {
  costPerUnitInputSchema,
  counterfactualImpactInputSchema,
  netSavingsInputSchema,
  paybackMonthsInputSchema,
  projectThirtyDaysInputSchema,
  savingsPercentageInputSchema,
} from './contracts.js';

export type Calculation = Readonly<{
  formulaVersion: 'economics-v1';
  formula: string;
  inputs: Readonly<Record<string, string | null>>;
  value: Readonly<{ numerator: string; denominator: string }> | null;
  unavailableReason:
    | 'ZERO_DENOMINATOR'
    | 'MISSING_DENOMINATOR'
    | 'INSUFFICIENT_COVERAGE'
    | 'NON_POSITIVE_RECURRING_SAVING'
    | null;
}>;
type Inputs = Record<string, string | null>;
type Reason = Exclude<Calculation['unavailableReason'], null>;

function evidence(
  formula: string,
  inputs: Inputs,
  value: Rational | null,
  unavailableReason: Reason | null = null,
): Calculation {
  return Object.freeze({
    formulaVersion: 'economics-v1',
    formula,
    inputs: Object.freeze({ ...inputs }),
    value: value === null ? null : serialize(value),
    unavailableReason,
  });
}
function unavailable(
  formula: string,
  inputs: Inputs,
  reason: Reason,
): Calculation {
  return evidence(formula, inputs, null, reason);
}

export function costPerUnit(input: unknown): Calculation {
  const data = costPerUnitInputSchema.parse(input);
  const formula = 'totalCost / units';
  if (data.units === null)
    return unavailable(formula, data, 'MISSING_DENOMINATOR');
  if (data.units === '0') return unavailable(formula, data, 'ZERO_DENOMINATOR');
  return evidence(
    formula,
    data,
    divide(parseDecimal(data.totalCost), rational(BigInt(data.units))),
  );
}

export function projectThirtyDays(input: unknown): Calculation {
  const data = projectThirtyDaysInputSchema.parse(input);
  const formula = 'observedCost / coveredDays * 30';
  // Coverage is supplied by a future coverage service; this function does not certify completeness.
  if (BigInt(data.coveredDays) < 7n)
    return unavailable(formula, data, 'INSUFFICIENT_COVERAGE');
  return evidence(
    formula,
    data,
    multiply(
      divide(
        parseDecimal(data.observedCost),
        rational(BigInt(data.coveredDays)),
      ),
      rational(30n),
    ),
  );
}

export function netSavings(input: unknown): Calculation {
  const data = netSavingsInputSchema.parse(input);
  const formula =
    'baselineCost - candidateCost - implementationCost - operatingCost';
  const value = subtract(
    subtract(
      subtract(
        parseDecimal(data.baselineCost),
        parseDecimal(data.candidateCost),
      ),
      parseDecimal(data.implementationCost),
    ),
    parseDecimal(data.operatingCost),
  );
  return evidence(formula, data, value);
}

export function savingsPercentage(input: unknown): Calculation {
  const data = savingsPercentageInputSchema.parse(input);
  const formula = 'netSaving / baselineCost * 100';
  if (parseDecimal(data.baselineCost).numerator === 0n)
    return unavailable(formula, data, 'ZERO_DENOMINATOR');
  return evidence(
    formula,
    data,
    multiply(
      divide(parseDecimal(data.netSaving), parseDecimal(data.baselineCost)),
      rational(100n),
    ),
  );
}

export function paybackMonths(input: unknown): Calculation {
  const data = paybackMonthsInputSchema.parse(input);
  const formula = 'implementationCost / recurringMonthlyNetSaving';
  const recurring = parseDecimal(data.recurringMonthlyNetSaving);
  if (compare(recurring, rational(0n)) <= 0)
    return unavailable(formula, data, 'NON_POSITIVE_RECURRING_SAVING');
  return evidence(
    formula,
    data,
    divide(parseDecimal(data.implementationCost), recurring),
  );
}

export function counterfactualImpact(input: unknown): Calculation {
  const data = counterfactualImpactInputSchema.parse(input);
  const formula =
    'baselineCost / baselineUnits * postUnits - actualPostCost - implementationCost - operatingCost';
  if (data.baselineUnits === '0')
    return unavailable(formula, data, 'ZERO_DENOMINATOR');
  if (data.baselineUnits === null || data.postUnits === null)
    return unavailable(formula, data, 'MISSING_DENOMINATOR');
  const counterfactual = multiply(
    divide(
      parseDecimal(data.baselineCost),
      rational(BigInt(data.baselineUnits)),
    ),
    rational(BigInt(data.postUnits)),
  );
  const value = subtract(
    subtract(
      subtract(counterfactual, parseDecimal(data.actualPostCost)),
      parseDecimal(data.implementationCost),
    ),
    parseDecimal(data.operatingCost),
  );
  return evidence(formula, data, value);
}
