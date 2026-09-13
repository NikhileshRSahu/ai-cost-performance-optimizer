import { describe, expect, it } from 'vitest';
import {
  computeConfidence,
  confidenceBand,
} from '../../src/benchmarks/confidence.js';
import {
  evaluateBenchmark,
  type BenchmarkCase,
} from '../../src/benchmarks/evaluate.js';

function cases(
  count: number,
  options: Readonly<{
    candidateQuality?: string | null;
    candidateLatency?: string | null;
    candidateCost?: string;
    candidateOutcome?: 'SUCCESS' | 'FAILURE' | 'TIMEOUT';
    repetitions?: number;
  }> = {},
): BenchmarkCase[] {
  const result: BenchmarkCase[] = [];
  const repetitions = options.repetitions ?? 1;

  for (let caseIndex = 0; caseIndex < count; caseIndex++) {
    for (let repetition = 0; repetition < repetitions; repetition++) {
      const common = {
        caseId: `case-${String(caseIndex)}`,
        repetitionId: `rep-${String(repetition)}`,
        evaluatorVersion: 'eval-v1',
      };
      result.push({
        ...common,
        configurationId: 'current',
        outcome: 'SUCCESS',
        qualityScore: '0.95',
        latencyMs: '100',
        cost: '1',
      });
      result.push({
        ...common,
        configurationId: 'candidate',
        outcome: options.candidateOutcome ?? 'SUCCESS',
        qualityScore:
          options.candidateQuality === undefined
            ? '0.9'
            : options.candidateQuality,
        latencyMs:
          options.candidateLatency === undefined
            ? '100'
            : options.candidateLatency,
        cost: options.candidateCost ?? '0.5',
      });
    }
  }
  return result;
}

const constraints = {
  requiredQuality: '0.9',
  maxP95LatencyMs: '100',
  maxFailureRate: '0',
  targetCases: 10,
} as const;

describe('benchmark decision engine', () => {
  it('passes equality at configured quality and latency boundaries', () => {
    const result = evaluateBenchmark({
      cases: cases(10),
      currentConfigurationId: 'current',
      candidateConfigurationId: 'candidate',
      evaluatorVersion: 'eval-v1',
      constraints,
    });

    expect(result.decision).toBe('OPTIMIZE');
    expect(result.metrics.candidateQuality).toEqual({
      numerator: '9',
      denominator: '10',
    });
    expect(result.metrics.candidateP95LatencyMs).toEqual({
      numerator: '100',
      denominator: '1',
    });
  });

  it('gives measured failure precedence over inadequate samples', () => {
    const result = evaluateBenchmark({
      cases: cases(1, { candidateQuality: '0.8' }),
      currentConfigurationId: 'current',
      candidateConfigurationId: 'candidate',
      evaluatorVersion: 'eval-v1',
      constraints,
    });

    expect(result.pairedValidCases).toBe(1);
    expect(result.decision).toBe('DO_NOT_CHANGE');
    expect(result.reasons).toContain('QUALITY_BELOW_REQUIREMENT');
  });

  it('does not let repetitions inflate distinct paired case adequacy', () => {
    const result = evaluateBenchmark({
      cases: cases(1, { repetitions: 10 }),
      currentConfigurationId: 'current',
      candidateConfigurationId: 'candidate',
      evaluatorVersion: 'eval-v1',
      constraints,
    });

    expect(result.pairedValidCases).toBe(1);
    expect(result.decision).toBe('INSUFFICIENT_EVIDENCE');
    expect(result.reasons).toContain('INADEQUATE_SAMPLE');
  });

  it('treats unmatched cases as insufficient evidence', () => {
    const input = cases(10);
    input.push({
      caseId: 'current-only',
      repetitionId: 'rep-0',
      configurationId: 'current',
      outcome: 'SUCCESS',
      qualityScore: '0.95',
      latencyMs: '100',
      cost: '1',
      evaluatorVersion: 'eval-v1',
    });

    const result = evaluateBenchmark({
      cases: input,
      currentConfigurationId: 'current',
      candidateConfigurationId: 'candidate',
      evaluatorVersion: 'eval-v1',
      constraints,
    });

    expect(result.decision).toBe('INSUFFICIENT_EVIDENCE');
    expect(result.reasons).toContain('UNMATCHED_CASES_OR_CONFIGURATIONS');
  });

  it('uses nearest-rank p95 instead of averaging latency percentiles', () => {
    const input = cases(20);
    const candidate = input.filter(
      (item) => item.configurationId === 'candidate',
    );
    for (const item of candidate.slice(0, 19)) {
      (item as { latencyMs: string | null }).latencyMs = '100';
    }
    (candidate[19] as { latencyMs: string | null }).latencyMs = '1000';

    const result = evaluateBenchmark({
      cases: input,
      currentConfigurationId: 'current',
      candidateConfigurationId: 'candidate',
      evaluatorVersion: 'eval-v1',
      constraints: { ...constraints, targetCases: 20 },
    });

    expect(result.metrics.candidateP95LatencyMs).toEqual({
      numerator: '100',
      denominator: '1',
    });
    expect(result.decision).toBe('OPTIMIZE');
  });

  it('returns DO_NOT_CHANGE for non-positive saving even with missing quality', () => {
    const result = evaluateBenchmark({
      cases: cases(1, {
        candidateQuality: null,
        candidateCost: '1',
      }),
      currentConfigurationId: 'current',
      candidateConfigurationId: 'candidate',
      evaluatorVersion: 'eval-v1',
      constraints,
    });

    expect(result.decision).toBe('DO_NOT_CHANGE');
    expect(result.reasons).toContain('NON_POSITIVE_NET_SAVING');
  });
});

describe('confidence', () => {
  it('uses the documented component weights and bands', () => {
    const result = computeConfidence({
      dataCompleteness: 1,
      evaluatorCoverage: 1,
      configurationParity: 1,
      measurementCoverage: 1,
      pairedValidCases: 10,
      targetCases: 10,
      decisionAgreement: 1,
      metricStability: 1,
      repetitions: 2,
    });

    expect(result.score).toBe(1);
    expect(result.band).toBe('HIGH');
    expect(confidenceBand(0.6)).toBe('MEDIUM');
    expect(confidenceBand(0.8)).toBe('HIGH');
  });
});
