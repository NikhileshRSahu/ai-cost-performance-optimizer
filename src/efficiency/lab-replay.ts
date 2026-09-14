import type { OptimizationLabEvidence } from '../workbench/lab-view.js';
import {
  replayHistoricalCounterfactual,
  type CounterfactualReplay,
} from './counterfactual-replay.js';

export function replayFromOptimizationLab(
  input: Readonly<{
    lab: OptimizationLabEvidence;
    historicalBaselineCost: string;
    historicalWindowComparable: boolean;
  }>,
): CounterfactualReplay {
  if (
    input.lab.economics.baselineCost === null ||
    input.lab.economics.candidateCost === null
  ) {
    return Object.freeze({
      status: 'INELIGIBLE_BASELINE',
      reasons: Object.freeze(['LAB_COMPARABLE_COST_MISSING']),
      historicalBaselineCost: null,
      benchmarkCostRatio: null,
      projectedCandidateCost: null,
      projectedGrossSaving: null,
      benchmarkDecision: input.lab.persistedDecision,
      benchmarkConfidenceBand: input.lab.confidence.band,
      qualityGuardEvidence: null,
      latencyGuardEvidence: null,
      claimBoundary:
        'Counterfactual replay is withheld because persisted benchmark comparable-cost evidence is incomplete.',
    });
  }

  const qualityConstraint = input.lab.constraints.find(
    (constraint) => constraint.name.toLowerCase() === 'quality',
  );
  const latencyConstraint = input.lab.constraints.find((constraint) =>
    constraint.name.toLowerCase().includes('latency'),
  );

  return replayHistoricalCounterfactual({
    historicalBaselineCost: input.historicalBaselineCost,
    historicalWindowComparable: input.historicalWindowComparable,
    benchmark: {
      decision: input.lab.persistedDecision,
      reasons: [],
      pairedValidCases: 0,
      metrics: {
        candidateQuality:
          qualityConstraint?.candidateMeasured === null ||
          qualityConstraint?.candidateMeasured === undefined
            ? null
            : decimalToExact(qualityConstraint.candidateMeasured),
        candidateP95LatencyMs:
          latencyConstraint?.candidateMeasured === null ||
          latencyConstraint?.candidateMeasured === undefined
            ? null
            : decimalToExact(latencyConstraint.candidateMeasured),
        candidateFailureRate: { numerator: '0', denominator: '1' },
        currentComparableCost: decimalToExact(
          input.lab.economics.baselineCost,
        ),
        candidateComparableCost: decimalToExact(
          input.lab.economics.candidateCost,
        ),
        netSaving: {
          numerator: input.lab.economics.netSavingNumerator ?? '0',
          denominator: input.lab.economics.netSavingDenominator ?? '1',
        },
      },
      confidence: {
        version: 'confidence-v1',
        score:
          input.lab.confidence.band === 'HIGH'
            ? 0.8
            : input.lab.confidence.band === 'MEDIUM'
              ? 0.6
              : 0,
        band: input.lab.confidence.band,
        components: {
          dataCompleteness: 0,
          benchmarkStrength: 0,
          sampleAdequacy: 0,
          repeatability: 0,
        },
      },
    },
  });
}

function decimalToExact(value: string): Readonly<{
  numerator: string;
  denominator: string;
}> {
  const negative = value.startsWith('-');
  const unsigned = negative ? value.slice(1) : value;
  const [integerPart = '0', fractionPart = ''] = unsigned.split('.');
  const denominator = 10n ** BigInt(fractionPart.length);
  const numerator =
    BigInt(integerPart) * denominator +
    BigInt(fractionPart.length === 0 ? '0' : fractionPart);

  return Object.freeze({
    numerator: (negative ? -numerator : numerator).toString(),
    denominator: denominator.toString(),
  });
}
