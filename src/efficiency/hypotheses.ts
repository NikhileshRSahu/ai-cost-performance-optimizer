import { compare, parseDecimal } from '../economics/exact.js';
import type { UsageDiagnosis, UsageDiagnosisFact } from './usage-diagnosis.js';

export type OptimizationHypothesisKind =
  | 'RETRY_POLICY'
  | 'PROMPT_CACHING'
  | 'MODEL_PORTFOLIO_REVIEW'
  | 'OUTPUT_BUDGET';

export type OptimizationHypothesis = Readonly<{
  id: string;
  kind: OptimizationHypothesisKind;
  title: string;
  trigger: string;
  mechanism: string;
  testPlan: string;
  qualityGuard: string;
  notClaimed: string;
  evidenceKeys: readonly UsageDiagnosisFact['key'][];
}>;

export type HypothesisPolicy = Readonly<{
  maximumTopModelCostShare: string;
  maximumOutputTokensPerRequest: string;
  minimumCacheHitRatio: string;
}>;

function decimalEvidence(
  diagnosis: UsageDiagnosis,
  key: UsageDiagnosisFact['key'],
  evidenceKey: string,
): string | null {
  const fact = diagnosis.facts.find((item) => item.key === key);
  if (fact === undefined) return null;
  const value = fact.evidence[evidenceKey];
  return typeof value === 'string' ? value : null;
}

function exactFractionToDecimal(
  value: string,
): ReturnType<typeof parseDecimal> {
  const match = /^(-?\d+)\/(\d+)$/.exec(value);
  if (match === null) {
    throw new Error('INVALID_DIAGNOSIS_FRACTION');
  }
  const numerator = BigInt(match[1] ?? '0');
  const denominator = BigInt(match[2] ?? '0');
  if (denominator <= 0n) throw new Error('INVALID_DIAGNOSIS_FRACTION');
  return Object.freeze({ numerator, denominator });
}

function hypothesis(input: OptimizationHypothesis): OptimizationHypothesis {
  return Object.freeze({
    ...input,
    evidenceKeys: Object.freeze([...input.evidenceKeys]),
  });
}

export function generateOptimizationHypotheses(
  input: Readonly<{
    diagnosis: UsageDiagnosis;
    policy: HypothesisPolicy;
  }>,
): readonly OptimizationHypothesis[] {
  const hypotheses: OptimizationHypothesis[] = [];

  const retryCost = decimalEvidence(
    input.diagnosis,
    'RETRY_ATTEMPT_COST',
    'exactRepeatedAttemptCost',
  );
  if (
    retryCost !== null &&
    compare(exactFractionToDecimal(retryCost), parseDecimal('0')) > 0
  ) {
    hypotheses.push(
      hypothesis({
        id: 'retry-policy-review',
        kind: 'RETRY_POLICY',
        title: 'Test a bounded retry and timeout policy',
        trigger:
          'Request-level evidence shows measurable spend on repeated attempts.',
        mechanism:
          'Reduce avoidable repeated calls while preserving retries needed for transient failures.',
        testPlan:
          'Replay a representative failure mix with the current policy and a bounded candidate policy, then compare success rate, latency, and total cost.',
        qualityGuard:
          'Reject the candidate if successful outcomes fall below the configured workload requirement.',
        notClaimed:
          'Repeated attempts are not assumed to be waste; the candidate must prove that removed attempts were unnecessary.',
        evidenceKeys: ['RETRY_ATTEMPT_COST'],
      }),
    );
  }

  const cacheRatio = decimalEvidence(
    input.diagnosis,
    'CACHE_HIT_RATIO',
    'exactHitRatio',
  );
  if (
    cacheRatio !== null &&
    compare(
      exactFractionToDecimal(cacheRatio),
      parseDecimal(input.policy.minimumCacheHitRatio),
    ) < 0
  ) {
    hypotheses.push(
      hypothesis({
        id: 'prompt-caching-review',
        kind: 'PROMPT_CACHING',
        title: 'Test higher cache reuse on explicitly eligible input',
        trigger:
          'Measured cache coverage is below the configured minimum on input already marked cache-eligible.',
        mechanism:
          'Increase reuse of stable eligible prefixes without changing task semantics.',
        testPlan:
          'Benchmark provider-supported caching on the same workload and compare cost, latency, and quality.',
        qualityGuard:
          'Reject any configuration that changes the effective prompt content or violates the workload quality floor.',
        notClaimed:
          'The system does not infer cache eligibility from raw token volume alone.',
        evidenceKeys: ['CACHE_HIT_RATIO'],
      }),
    );
  }

  const modelShare = decimalEvidence(
    input.diagnosis,
    'TOP_MODEL_COST_SHARE',
    'exactShare',
  );
  if (
    modelShare !== null &&
    compare(
      exactFractionToDecimal(modelShare),
      parseDecimal(input.policy.maximumTopModelCostShare),
    ) > 0
  ) {
    hypotheses.push(
      hypothesis({
        id: 'model-portfolio-review',
        kind: 'MODEL_PORTFOLIO_REVIEW',
        title: 'Benchmark a lower-cost candidate for concentrated model spend',
        trigger:
          'One model accounts for more cost than the configured concentration threshold.',
        mechanism:
          'Route only eligible workload slices to a cheaper candidate rather than replacing the dominant model globally.',
        testPlan:
          'Select one representative, well-attributed workload and benchmark the current model against a lower-cost candidate on identical examples.',
        qualityGuard:
          'Keep the current model unless the candidate passes every configured quality and latency constraint.',
        notClaimed:
          'High model concentration is not itself proof that the model is oversized or replaceable.',
        evidenceKeys: ['TOP_MODEL_COST_SHARE'],
      }),
    );
  }

  const outputRate = decimalEvidence(
    input.diagnosis,
    'OUTPUT_TOKENS_PER_REQUEST',
    'exactOutputTokensPerRequest',
  );
  if (
    outputRate !== null &&
    compare(
      exactFractionToDecimal(outputRate),
      parseDecimal(input.policy.maximumOutputTokensPerRequest),
    ) > 0
  ) {
    hypotheses.push(
      hypothesis({
        id: 'output-budget-review',
        kind: 'OUTPUT_BUDGET',
        title: 'Test a tighter output budget',
        trigger:
          'Measured output tokens per request exceed the configured workload threshold.',
        mechanism:
          'Reduce unnecessary completion length through output limits or more concise instructions.',
        testPlan:
          'Benchmark a constrained-output candidate on the same evaluation set and compare quality, completion rate, latency, and cost.',
        qualityGuard:
          'Reject the candidate if answer completeness or any configured evaluation metric falls below the required floor.',
        notClaimed:
          'Long outputs are not assumed to be wasteful; usefulness must be tested before changing them.',
        evidenceKeys: ['OUTPUT_TOKENS_PER_REQUEST'],
      }),
    );
  }

  return Object.freeze(hypotheses);
}
