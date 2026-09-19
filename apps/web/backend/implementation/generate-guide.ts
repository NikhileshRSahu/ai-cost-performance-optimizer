import type {
  OptimizationHypothesis,
  OptimizationHypothesisKind,
} from '../efficiency/hypotheses.js';
import type { ImplementationGuide } from './records.js';

type GuideTemplate = Readonly<{
  prerequisites: readonly string[];
  rolloutSteps: readonly string[];
  metricsToWatch: readonly string[];
  stopConditions: readonly string[];
  rollbackInstructions: readonly string[];
}>;

function templateFor(kind: OptimizationHypothesisKind): GuideTemplate {
  switch (kind) {
    case 'RETRY_POLICY':
      return Object.freeze({
        prerequisites: Object.freeze([
          'Capture request-level attempt, outcome, latency, and cost evidence for the target workload.',
          'Record the current timeout and retry policy before changing it.',
        ]),
        rolloutSteps: Object.freeze([
          'Apply the benchmarked retry policy to a small canary slice of the target workload.',
          'Hold the canary through the agreed stabilization window while measuring success, latency, repeated attempts, and cost.',
          'Expand traffic only if every configured guard remains inside its allowed bound.',
        ]),
        metricsToWatch: Object.freeze([
          'successful outcomes',
          'failure rate',
          'p95 latency',
          'repeated-attempt cost',
          'cost per successful outcome',
        ]),
        stopConditions: Object.freeze([
          'Stop if successful outcomes fall below the configured workload requirement.',
          'Stop if failure rate or p95 latency breaches its configured maximum.',
          'Stop if measured cost per successful outcome does not improve.',
        ]),
        rollbackInstructions: Object.freeze([
          'Restore the previously recorded timeout and retry policy.',
          'Route all canary traffic back to the prior configuration.',
          'Preserve the failed rollout evidence for verification and diagnosis.',
        ]),
      });
    case 'PROMPT_CACHING':
      return Object.freeze({
        prerequisites: Object.freeze([
          'Confirm the targeted prompt prefix is explicitly cache-eligible and stable.',
          'Record the current uncached prompt behavior and provider cache semantics.',
        ]),
        rolloutSteps: Object.freeze([
          'Enable the benchmarked cache strategy for one stable-prefix workload slice.',
          'Compare cache reuse, cost, latency, and quality against the current configuration.',
          'Increase rollout only after the quality floor and cache-behavior assumptions remain valid.',
        ]),
        metricsToWatch: Object.freeze([
          'cache hit ratio',
          'input-token cost',
          'total cost',
          'quality score',
          'p95 latency',
        ]),
        stopConditions: Object.freeze([
          'Stop if effective prompt content differs from the tested configuration.',
          'Stop if quality falls below the configured floor.',
          'Stop if cache behavior fails to produce the expected measurable reuse.',
        ]),
        rollbackInstructions: Object.freeze([
          'Disable the candidate cache configuration for the affected workload.',
          'Restore the prior prompt and cache settings.',
          'Preserve cache-hit and cost evidence for root-cause analysis.',
        ]),
      });
    case 'MODEL_PORTFOLIO_REVIEW':
      return Object.freeze({
        prerequisites: Object.freeze([
          'Identify the exact workload slice represented by the benchmark.',
          'Keep the current production model available as an immediate fallback.',
        ]),
        rolloutSteps: Object.freeze([
          'Route a small canary of only the benchmarked workload slice to the candidate model.',
          'Measure quality, failure rate, latency, and cost on the same outcome definition used by the benchmark.',
          'Expand routing gradually only when all configured constraints continue to pass.',
        ]),
        metricsToWatch: Object.freeze([
          'quality score',
          'successful outcomes',
          'failure rate',
          'p95 latency',
          'cost per request',
          'cost per successful outcome',
        ]),
        stopConditions: Object.freeze([
          'Stop if any configured quality or reliability constraint fails.',
          'Stop if the candidate workload mix materially differs from the benchmarked slice.',
          'Stop if net economics are not better after comparable traffic.',
        ]),
        rollbackInstructions: Object.freeze([
          'Route the affected workload slice back to the previous model.',
          'Restore the prior routing configuration.',
          'Retain candidate evidence as a DO_NOT_CHANGE or re-test result.',
        ]),
      });
    case 'OUTPUT_BUDGET':
      return Object.freeze({
        prerequisites: Object.freeze([
          'Record the current output limit and completion instructions.',
          'Define the answer-completeness or task-quality metric that must not regress.',
        ]),
        rolloutSteps: Object.freeze([
          'Apply the benchmarked output budget to a small canary slice.',
          'Measure completion quality, truncation/failure behavior, latency, and output-token cost.',
          'Increase rollout only if answer completeness and every hard constraint continue to pass.',
        ]),
        metricsToWatch: Object.freeze([
          'output tokens per request',
          'answer completeness',
          'quality score',
          'failure rate',
          'p95 latency',
          'cost per successful outcome',
        ]),
        stopConditions: Object.freeze([
          'Stop if outputs become incomplete or truncated for valid requests.',
          'Stop if quality falls below the configured requirement.',
          'Stop if the candidate does not produce a meaningful economic improvement.',
        ]),
        rollbackInstructions: Object.freeze([
          'Restore the previous output budget and completion instructions.',
          'Route canary traffic back to the prior configuration.',
          'Preserve failed examples for benchmark refinement.',
        ]),
      });
  }
}

export function generateImplementationGuide(
  input: Readonly<{
    hypothesis: OptimizationHypothesis;
    recommendationId: string;
    organizationId: string;
    workload: string;
    environment: string;
    expectedEconomicsEvidenceRef: string;
  }>,
): ImplementationGuide {
  const template = templateFor(input.hypothesis.kind);

  return Object.freeze({
    recommendationId: input.recommendationId,
    organizationId: input.organizationId,
    proposedChange: input.hypothesis.title,
    workload: input.workload,
    environment: input.environment,
    prerequisites: template.prerequisites,
    rolloutSteps: template.rolloutSteps,
    metricsToWatch: template.metricsToWatch,
    stopConditions: Object.freeze([
      input.hypothesis.qualityGuard,
      ...template.stopConditions,
    ]),
    rollbackInstructions: template.rollbackInstructions,
    expectedEconomicsEvidenceRef: input.expectedEconomicsEvidenceRef,
    reviewedByOperatorUserId: null,
    reviewedAt: null,
  });
}
