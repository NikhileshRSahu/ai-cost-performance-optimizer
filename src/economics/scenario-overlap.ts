import { add, compare, formatDecimal, parseDecimal, rational } from './exact.js';
import type { ScenarioBand } from './scenarios.js';

export type ScenarioWithOverlap = Readonly<{
  recommendationId: string;
  range: ScenarioBand;
  overlapGroup: string | null;
}>;

function shouldReplace(
  current: ScenarioWithOverlap,
  candidate: ScenarioWithOverlap,
): boolean {
  const lowComparison = compare(
    parseDecimal(candidate.range.low),
    parseDecimal(current.range.low),
  );
  if (lowComparison !== 0) return lowComparison > 0;
  return candidate.recommendationId.localeCompare(current.recommendationId) < 0;
}

export function nonOverlappingScenarioTotal(
  scenarios: readonly ScenarioWithOverlap[],
): ScenarioBand | null {
  if (scenarios.length === 0) return null;

  const selected: ScenarioWithOverlap[] = [];
  const grouped = new Map<string, ScenarioWithOverlap>();

  for (const scenario of scenarios) {
    if (scenario.overlapGroup === null) {
      selected.push(scenario);
      continue;
    }

    const current = grouped.get(scenario.overlapGroup);
    if (current === undefined || shouldReplace(current, scenario)) {
      grouped.set(scenario.overlapGroup, scenario);
    }
  }

  selected.push(...grouped.values());

  let low = rational(0n);
  let base = rational(0n);
  let high = rational(0n);

  for (const scenario of selected) {
    low = add(low, parseDecimal(scenario.range.low));
    base = add(base, parseDecimal(scenario.range.base));
    high = add(high, parseDecimal(scenario.range.high));
  }

  return Object.freeze({
    low: formatDecimal(low, 2),
    base: formatDecimal(base, 2),
    high: formatDecimal(high, 2),
  });
}
