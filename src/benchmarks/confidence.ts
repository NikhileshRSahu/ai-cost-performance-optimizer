export type ConfidenceBand = 'LOW' | 'MEDIUM' | 'HIGH';

export type ConfidenceResult = Readonly<{
  version: 'confidence-v1';
  score: number;
  band: ConfidenceBand;
  components: Readonly<{
    dataCompleteness: number;
    benchmarkStrength: number;
    sampleAdequacy: number;
    repeatability: number;
  }>;
}>;

function bounded(value: number): number {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error('CONFIDENCE_COMPONENT_OUT_OF_RANGE');
  }
  return value;
}

export function confidenceBand(score: number): ConfidenceBand {
  if (score >= 0.8) return 'HIGH';
  if (score >= 0.6) return 'MEDIUM';
  return 'LOW';
}

export function computeConfidence(input: Readonly<{
  dataCompleteness: number;
  evaluatorCoverage: number;
  configurationParity: number;
  measurementCoverage: number;
  pairedValidCases: number;
  targetCases: number;
  decisionAgreement: number;
  metricStability: number;
  repetitions: number;
}>): ConfidenceResult {
  if (!Number.isInteger(input.pairedValidCases) || input.pairedValidCases < 0) {
    throw new Error('INVALID_PAIRED_CASE_COUNT');
  }
  if (!Number.isInteger(input.targetCases) || input.targetCases < 10) {
    throw new Error('TARGET_CASES_MIN_10');
  }
  if (!Number.isInteger(input.repetitions) || input.repetitions < 0) {
    throw new Error('INVALID_REPETITION_COUNT');
  }

  const dataCompleteness = bounded(input.dataCompleteness);
  const benchmarkStrength =
    0.4 * bounded(input.evaluatorCoverage) +
    0.3 * bounded(input.configurationParity) +
    0.3 * bounded(input.measurementCoverage);
  const sampleAdequacy = Math.min(
    1,
    input.pairedValidCases / input.targetCases,
  );
  const repeatability =
    input.repetitions < 2
      ? 0
      : 0.5 * bounded(input.decisionAgreement) +
        0.5 * bounded(input.metricStability);

  const score =
    0.3 * dataCompleteness +
    0.3 * benchmarkStrength +
    0.2 * sampleAdequacy +
    0.2 * repeatability;

  return Object.freeze({
    version: 'confidence-v1',
    score,
    band: confidenceBand(score),
    components: Object.freeze({
      dataCompleteness,
      benchmarkStrength,
      sampleAdequacy,
      repeatability,
    }),
  });
}
