import {
  add,
  compare,
  divide,
  parseDecimal,
  rational,
  serialize,
  subtract,
  type Rational,
} from '../economics/exact.js';
import { computeConfidence, type ConfidenceResult } from './confidence.js';

export type BenchmarkOutcome = 'SUCCESS' | 'FAILURE' | 'TIMEOUT';
export type BenchmarkDecision =
  'OPTIMIZE' | 'DO_NOT_CHANGE' | 'INSUFFICIENT_EVIDENCE';

export type BenchmarkCase = Readonly<{
  caseId: string;
  repetitionId: string;
  configurationId: string;
  outcome: BenchmarkOutcome;
  qualityScore: string | null;
  latencyMs: string | null;
  cost: string;
  evaluatorVersion: string;
}>;

export type BenchmarkConstraints = Readonly<{
  requiredQuality: string;
  maxP95LatencyMs: string | null;
  maxFailureRate: string | null;
  targetCases?: number;
}>;

export type BenchmarkEvaluation = Readonly<{
  decision: BenchmarkDecision;
  reasons: readonly string[];
  pairedValidCases: number;
  metrics: Readonly<{
    candidateQuality: Readonly<{
      numerator: string;
      denominator: string;
    }> | null;
    candidateP95LatencyMs: Readonly<{
      numerator: string;
      denominator: string;
    }> | null;
    candidateFailureRate: Readonly<{
      numerator: string;
      denominator: string;
    }>;
    currentComparableCost: Readonly<{
      numerator: string;
      denominator: string;
    }>;
    candidateComparableCost: Readonly<{
      numerator: string;
      denominator: string;
    }>;
    netSaving: Readonly<{ numerator: string; denominator: string }>;
  }>;
  confidence: ConfidenceResult;
}>;

function key(record: BenchmarkCase): string {
  return `${record.caseId}\u0000${record.repetitionId}`;
}

function mean(values: readonly Rational[]): Rational | null {
  if (values.length === 0) return null;
  const total = values.reduce((sum, value) => add(sum, value), rational(0n));
  return divide(total, rational(BigInt(values.length)));
}

function nearestRank(
  values: readonly Rational[],
  percentile: number,
): Rational | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => compare(a, b));
  const rank = Math.ceil(percentile * sorted.length);
  return sorted[Math.max(0, rank - 1)] ?? null;
}

function median(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const upper = sorted[middle] ?? 0;
  if (sorted.length % 2 === 1) return upper;
  return ((sorted[middle - 1] ?? upper) + upper) / 2;
}

function metricStability(values: readonly number[]): number {
  if (values.length < 2) return 0;
  const center = median(values);
  const mad = median(values.map((value) => Math.abs(value - center)));
  const relativeMad = mad / Math.max(Math.abs(center), 1e-12);
  return Math.max(0, 1 - relativeMad / 0.1);
}

function rationalNumber(value: Rational): number {
  return Number(value.numerator) / Number(value.denominator);
}

function validateScore(value: Rational): void {
  if (compare(value, rational(0n)) < 0 || compare(value, rational(1n)) > 0) {
    throw new Error('QUALITY_SCORE_OUT_OF_RANGE');
  }
}

export function evaluateBenchmark(
  input: Readonly<{
    cases: readonly BenchmarkCase[];
    currentConfigurationId: string;
    candidateConfigurationId: string;
    evaluatorVersion: string;
    constraints: BenchmarkConstraints;
  }>,
): BenchmarkEvaluation {
  const targetCases = input.constraints.targetCases ?? 30;
  if (!Number.isInteger(targetCases) || targetCases < 10) {
    throw new Error('TARGET_CASES_MIN_10');
  }

  const current = new Map<string, BenchmarkCase>();
  const candidate = new Map<string, BenchmarkCase>();

  for (const record of input.cases) {
    if (record.evaluatorVersion !== input.evaluatorVersion) continue;
    const target =
      record.configurationId === input.currentConfigurationId
        ? current
        : record.configurationId === input.candidateConfigurationId
          ? candidate
          : null;
    if (target === null) continue;
    const recordKey = key(record);
    if (target.has(recordKey)) throw new Error('DUPLICATE_BENCHMARK_CASE');
    parseDecimal(record.cost);
    if (record.qualityScore !== null) {
      validateScore(parseDecimal(record.qualityScore));
    }
    if (record.latencyMs !== null) {
      const latency = parseDecimal(record.latencyMs);
      if (compare(latency, rational(0n)) < 0) {
        throw new Error('NEGATIVE_LATENCY');
      }
    }
    target.set(recordKey, record);
  }

  const matchedKeys = [...current.keys()].filter((recordKey) =>
    candidate.has(recordKey),
  );
  const pairedCaseIds = new Set(
    matchedKeys
      .map((recordKey) => current.get(recordKey)?.caseId)
      .filter((caseId): caseId is string => caseId !== undefined),
  );
  const pairedValidCases = pairedCaseIds.size;

  let currentCost = rational(0n);
  let candidateCost = rational(0n);
  const candidateQualities: Rational[] = [];
  const candidateLatencies: Rational[] = [];
  let candidateFailures = 0;
  const repetitionQuality = new Map<string, Rational[]>();
  const repetitionConstraintPass = new Map<string, boolean[]>();

  for (const recordKey of matchedKeys) {
    const currentRecord = current.get(recordKey);
    const candidateRecord = candidate.get(recordKey);
    if (currentRecord === undefined || candidateRecord === undefined) continue;

    currentCost = add(currentCost, parseDecimal(currentRecord.cost));
    candidateCost = add(candidateCost, parseDecimal(candidateRecord.cost));

    if (candidateRecord.qualityScore !== null) {
      const quality = parseDecimal(candidateRecord.qualityScore);
      candidateQualities.push(quality);
      const values = repetitionQuality.get(candidateRecord.repetitionId) ?? [];
      values.push(quality);
      repetitionQuality.set(candidateRecord.repetitionId, values);
    }
    if (candidateRecord.latencyMs !== null) {
      candidateLatencies.push(parseDecimal(candidateRecord.latencyMs));
    }
    if (candidateRecord.outcome !== 'SUCCESS') candidateFailures++;

    const checks =
      repetitionConstraintPass.get(candidateRecord.repetitionId) ?? [];
    if (candidateRecord.qualityScore !== null) {
      checks.push(
        compare(
          parseDecimal(candidateRecord.qualityScore),
          parseDecimal(input.constraints.requiredQuality),
        ) >= 0,
      );
    }
    repetitionConstraintPass.set(candidateRecord.repetitionId, checks);
  }

  const candidateQuality = mean(candidateQualities);
  const candidateP95Latency = nearestRank(candidateLatencies, 0.95);
  const failureRate =
    matchedKeys.length === 0
      ? rational(0n)
      : rational(BigInt(candidateFailures), BigInt(matchedKeys.length));
  const netSaving = subtract(currentCost, candidateCost);

  const configuredMeasurements =
    2 + (input.constraints.maxP95LatencyMs === null ? 0 : 1);
  const availableMeasurements =
    1 +
    (candidateQuality === null ? 0 : 1) +
    (input.constraints.maxP95LatencyMs !== null && candidateP95Latency !== null
      ? 1
      : 0);
  const measurementCoverage = availableMeasurements / configuredMeasurements;
  const evaluatorCoverage =
    matchedKeys.length === 0
      ? 0
      : candidateQualities.length / matchedKeys.length;
  const configurationParity =
    Math.max(current.size, candidate.size) === 0
      ? 0
      : matchedKeys.length / Math.max(current.size, candidate.size);
  const dataCompleteness = measurementCoverage;

  const repetitionIds = [
    ...new Set(
      matchedKeys
        .map((recordKey) => candidate.get(recordKey)?.repetitionId)
        .filter((value): value is string => value !== undefined),
    ),
  ];
  const repetitionDecisions = repetitionIds
    .map((repetitionId) => repetitionConstraintPass.get(repetitionId) ?? [])
    .filter((checks) => checks.length > 0)
    .map((checks) => checks.every(Boolean));
  const passing = repetitionDecisions.filter(Boolean).length;
  const decisionAgreement =
    repetitionDecisions.length === 0
      ? 0
      : Math.max(passing, repetitionDecisions.length - passing) /
        repetitionDecisions.length;
  const perRepetitionQuality = repetitionIds
    .map((repetitionId) => mean(repetitionQuality.get(repetitionId) ?? []))
    .filter((value): value is Rational => value !== null)
    .map(rationalNumber);

  const confidence = computeConfidence({
    dataCompleteness,
    evaluatorCoverage,
    configurationParity,
    measurementCoverage,
    pairedValidCases,
    targetCases,
    decisionAgreement,
    metricStability: metricStability(perRepetitionQuality),
    repetitions: repetitionIds.length,
  });

  const reasons: string[] = [];
  let measuredFailure = false;

  if (
    candidateQuality !== null &&
    compare(candidateQuality, parseDecimal(input.constraints.requiredQuality)) <
      0
  ) {
    reasons.push('QUALITY_BELOW_REQUIREMENT');
    measuredFailure = true;
  }
  if (
    input.constraints.maxP95LatencyMs !== null &&
    candidateP95Latency !== null &&
    compare(
      candidateP95Latency,
      parseDecimal(input.constraints.maxP95LatencyMs),
    ) > 0
  ) {
    reasons.push('P95_LATENCY_ABOVE_MAXIMUM');
    measuredFailure = true;
  }
  if (
    input.constraints.maxFailureRate !== null &&
    compare(failureRate, parseDecimal(input.constraints.maxFailureRate)) > 0
  ) {
    reasons.push('FAILURE_RATE_ABOVE_MAXIMUM');
    measuredFailure = true;
  }
  if (compare(netSaving, rational(0n)) <= 0) {
    reasons.push('NON_POSITIVE_NET_SAVING');
    measuredFailure = true;
  }

  let decision: BenchmarkDecision;
  if (measuredFailure) {
    decision = 'DO_NOT_CHANGE';
  } else {
    if (
      matchedKeys.length !== current.size ||
      matchedKeys.length !== candidate.size
    ) {
      reasons.push('UNMATCHED_CASES_OR_CONFIGURATIONS');
    }
    if (candidateQuality === null) reasons.push('QUALITY_MEASUREMENT_MISSING');
    if (
      input.constraints.maxP95LatencyMs !== null &&
      candidateP95Latency === null
    ) {
      reasons.push('P95_LATENCY_MEASUREMENT_MISSING');
    }
    if (pairedValidCases < targetCases) reasons.push('INADEQUATE_SAMPLE');
    if (confidence.band === 'LOW') reasons.push('LOW_CONFIDENCE');

    decision = reasons.length === 0 ? 'OPTIMIZE' : 'INSUFFICIENT_EVIDENCE';
  }

  return Object.freeze({
    decision,
    reasons: Object.freeze(reasons),
    pairedValidCases,
    metrics: Object.freeze({
      candidateQuality:
        candidateQuality === null
          ? null
          : Object.freeze(serialize(candidateQuality)),
      candidateP95LatencyMs:
        candidateP95Latency === null
          ? null
          : Object.freeze(serialize(candidateP95Latency)),
      candidateFailureRate: Object.freeze(serialize(failureRate)),
      currentComparableCost: Object.freeze(serialize(currentCost)),
      candidateComparableCost: Object.freeze(serialize(candidateCost)),
      netSaving: Object.freeze(serialize(netSaving)),
    }),
    confidence,
  });
}
