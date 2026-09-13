import {
  compare,
  divide,
  multiply,
  parseDecimal,
  rational,
  serialize,
  subtract,
} from '../economics/exact.js';
import type { BenchmarkEvaluation } from '../benchmarks/evaluate.js';

export type CounterfactualReplayStatus =
  | 'PROJECTED'
  | 'INELIGIBLE_BENCHMARK'
  | 'INELIGIBLE_BASELINE';

export type CounterfactualReplay = Readonly<{
  status: CounterfactualReplayStatus;
  reasons: readonly string[];
  historicalBaselineCost: Readonly<{
    numerator: string;
    denominator: string;
  }> | null;
  benchmarkCostRatio: Readonly<{
    numerator: string;
    denominator: string;
  }> | null;
  projectedCandidateCost: Readonly<{
    numerator: string;
    denominator: string;
  }> | null;
  projectedGrossSaving: Readonly<{
    numerator: string;
    denominator: string;
  }> | null;
  benchmarkDecision: BenchmarkEvaluation['decision'];
  benchmarkConfidenceBand: BenchmarkEvaluation['confidence']['band'];
  qualityGuardEvidence: BenchmarkEvaluation['metrics']['candidateQuality'];
  latencyGuardEvidence: BenchmarkEvaluation['metrics']['candidateP95LatencyMs'];
  claimBoundary: string;
}>;

function fromSerialized(value: Readonly<{
  numerator: string;
  denominator: string;
}>) {
  return rational(BigInt(value.numerator), BigInt(value.denominator));
}

export function replayHistoricalCounterfactual(
  input: Readonly<{
    historicalBaselineCost: string;
    benchmark: BenchmarkEvaluation;
    historicalWindowComparable: boolean;
  }>,
): CounterfactualReplay {
  const baseline = parseDecimal(input.historicalBaselineCost);
  const reasons: string[] = [];

  if (compare(baseline, rational(0n)) <= 0) {
    reasons.push('HISTORICAL_BASELINE_COST_MUST_BE_POSITIVE');
  }

  if (!input.historicalWindowComparable) {
    reasons.push('HISTORICAL_WINDOW_NOT_COMPARABLE');
  }

  if (input.benchmark.decision !== 'OPTIMIZE') {
    reasons.push('BENCHMARK_NOT_APPROVED_FOR_OPTIMIZATION');
  }

  const currentComparableCost = fromSerialized(
    input.benchmark.metrics.currentComparableCost,
  );
  const candidateComparableCost = fromSerialized(
    input.benchmark.metrics.candidateComparableCost,
  );

  if (compare(currentComparableCost, rational(0n)) <= 0) {
    reasons.push('BENCHMARK_CURRENT_COST_MUST_BE_POSITIVE');
  }

  if (reasons.length > 0) {
    return Object.freeze({
      status:
        input.benchmark.decision !== 'OPTIMIZE'
          ? 'INELIGIBLE_BENCHMARK'
          : 'INELIGIBLE_BASELINE',
      reasons: Object.freeze(reasons),
      historicalBaselineCost:
        compare(baseline, rational(0n)) > 0
          ? Object.freeze(serialize(baseline))
          : null,
      benchmarkCostRatio: null,
      projectedCandidateCost: null,
      projectedGrossSaving: null,
      benchmarkDecision: input.benchmark.decision,
      benchmarkConfidenceBand: input.benchmark.confidence.band,
      qualityGuardEvidence: input.benchmark.metrics.candidateQuality,
      latencyGuardEvidence: input.benchmark.metrics.candidateP95LatencyMs,
      claimBoundary:
        'Counterfactual replay is withheld until a positive comparable historical baseline and an OPTIMIZE benchmark exist.',
    });
  }

  const ratio = divide(candidateComparableCost, currentComparableCost);
  const projectedCandidateCost = multiply(baseline, ratio);
  const projectedGrossSaving = subtract(baseline, projectedCandidateCost);

  return Object.freeze({
    status: 'PROJECTED',
    reasons: Object.freeze([]),
    historicalBaselineCost: Object.freeze(serialize(baseline)),
    benchmarkCostRatio: Object.freeze(serialize(ratio)),
    projectedCandidateCost: Object.freeze(serialize(projectedCandidateCost)),
    projectedGrossSaving: Object.freeze(serialize(projectedGrossSaving)),
    benchmarkDecision: input.benchmark.decision,
    benchmarkConfidenceBand: input.benchmark.confidence.band,
    qualityGuardEvidence: input.benchmark.metrics.candidateQuality,
    latencyGuardEvidence: input.benchmark.metrics.candidateP95LatencyMs,
    claimBoundary:
      'This is a cost-only counterfactual extrapolation from a controlled benchmark onto a comparable historical baseline. It is not verified savings and does not claim historical quality or latency would have been identical.',
  });
}
