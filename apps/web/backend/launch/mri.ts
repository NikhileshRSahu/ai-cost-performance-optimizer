import {
  add,
  compare,
  divide,
  formatDecimal,
  parseDecimal,
  rational,
  subtract,
  type Rational,
} from '../economics/exact.js';

export type LaunchUsageRecord = Readonly<{
  provider: string;
  model: string;
  requests: string;
  inputTokens: string | null;
  outputTokens: string | null;
  cachedInputTokens: string | null;
  totalCost: string | null;
  currency: string;
}>;

export type LaunchMriPolicy = Readonly<{
  minimumCacheHitRatio: string;
  maximumOutputTokensPerRequest: string;
  maximumModelRequestShare: string;
}>;

type LaunchMriOpportunity = Readonly<{
  kind: 'PROMPT_CACHING' | 'OUTPUT_BUDGET' | 'MODEL_CONCENTRATION';
  title: string;
  why: string;
  test: string;
  qualityGuard: string;
  evidence: Readonly<Record<string, string>>;
}>;

export type LaunchMriResult = Readonly<{
  metrics: Readonly<{
    totalRequests: string;
    observedSpend: string | null;
    costPerRequest: string | null;
    outputTokensPerRequest: string | null;
    cacheHitRatio: string | null;
  }>;
  opportunities: readonly LaunchMriOpportunity[];
  limitations: readonly string[];
}>;

const DEFAULT_POLICY: LaunchMriPolicy = Object.freeze({
  minimumCacheHitRatio: '0.25',
  maximumOutputTokensPerRequest: '300',
  maximumModelRequestShare: '0.70',
});

function nonNegativeCount(value: string | null): bigint | null {
  if (value === null || !/^(0|[1-9]\d*)$/.test(value)) return null;
  return BigInt(value);
}

function ratioPercent(value: Rational, digits = 2): string {
  return `${formatDecimal(divide(value, rational(1n, 100n)), digits)}%`;
}

function freezeOpportunity(
  opportunity: LaunchMriOpportunity,
): LaunchMriOpportunity {
  return Object.freeze({
    ...opportunity,
    evidence: Object.freeze({ ...opportunity.evidence }),
  });
}

export function analyzeUsageEvidence(
  input: Readonly<{
    reportingCurrency: string;
    records: readonly LaunchUsageRecord[];
    policy?: Partial<LaunchMriPolicy>;
  }>,
): LaunchMriResult {
  const policy: LaunchMriPolicy = {
    ...DEFAULT_POLICY,
    ...input.policy,
  };
  const limitations: string[] = [];
  const opportunities: LaunchMriOpportunity[] = [];

  let totalRequests = 0n;
  let totalInput = 0n;
  let totalOutput = 0n;
  let totalCached = 0n;
  let inputComplete = true;
  let outputComplete = true;
  let cachedComplete = true;
  const requestsByModel = new Map<string, bigint>();

  let spend = rational(0n);
  let spendRecords = 0;
  let excludedCurrency = false;

  for (const record of input.records) {
    const requests = nonNegativeCount(record.requests);
    if (requests === null) {
      throw new Error('INVALID_REQUEST_COUNT');
    }
    totalRequests += requests;
    requestsByModel.set(
      record.model,
      (requestsByModel.get(record.model) ?? 0n) + requests,
    );

    const inputTokens = nonNegativeCount(record.inputTokens);
    if (inputTokens === null) {
      inputComplete = false;
    } else {
      totalInput += inputTokens;
    }

    const outputTokens = nonNegativeCount(record.outputTokens);
    if (outputTokens === null) {
      outputComplete = false;
    } else {
      totalOutput += outputTokens;
    }

    const cachedTokens = nonNegativeCount(record.cachedInputTokens);
    if (cachedTokens === null) {
      cachedComplete = false;
    } else {
      totalCached += cachedTokens;
    }

    if (record.totalCost !== null) {
      const cost = parseDecimal(record.totalCost);
      if (cost.numerator < 0n) throw new Error('NEGATIVE_COST');
      if (record.currency === input.reportingCurrency) {
        spend = add(spend, cost);
        spendRecords++;
      } else {
        excludedCurrency = true;
      }
    }
  }

  const observedSpend =
    spendRecords > 0 ? formatDecimal(spend, 2) : null;
  const costPerRequest =
    observedSpend !== null && totalRequests > 0n
      ? formatDecimal(divide(spend, rational(totalRequests)), 6)
      : null;

  let outputTokensPerRequest: string | null = null;
  if (outputComplete && totalRequests > 0n) {
    const outputRate = divide(rational(totalOutput), rational(totalRequests));
    outputTokensPerRequest = formatDecimal(outputRate, 2);
    if (
      compare(
        outputRate,
        parseDecimal(policy.maximumOutputTokensPerRequest),
      ) > 0
    ) {
      opportunities.push(
        freezeOpportunity({
          kind: 'OUTPUT_BUDGET',
          title: 'Test a tighter output budget',
          why: 'Observed output tokens per request exceed the configured launch threshold.',
          test: 'Run the same evaluation set with a lower output cap or more concise response instruction.',
          qualityGuard:
            'Reject the candidate if answer completeness or required quality falls below the workload floor.',
          evidence: {
            outputTokensPerRequest,
            threshold: policy.maximumOutputTokensPerRequest,
          },
        }),
      );
    }
  } else {
    limitations.push(
      'Output-token efficiency is withheld because output-token evidence is incomplete.',
    );
  }

  let cacheHitRatio: string | null = null;
  if (inputComplete && cachedComplete && totalInput > 0n) {
    const ratio = divide(rational(totalCached), rational(totalInput));
    cacheHitRatio = ratioPercent(ratio);
    if (compare(ratio, parseDecimal(policy.minimumCacheHitRatio)) < 0) {
      opportunities.unshift(
        freezeOpportunity({
          kind: 'PROMPT_CACHING',
          title: 'Test higher prompt-cache reuse',
          why: 'Cached input is below the configured share of observed input tokens.',
          test: 'Benchmark provider-supported caching on stable prompt prefixes while holding task content constant.',
          qualityGuard:
            'Do not change effective prompt semantics merely to increase cache usage.',
          evidence: {
            cachedInputTokens: String(totalCached),
            inputTokens: String(totalInput),
            cacheHitRatio,
            threshold: ratioPercent(
              parseDecimal(policy.minimumCacheHitRatio),
            ),
          },
        }),
      );
    }
    limitations.push(
      'Cache hit ratio is a launch proxy using cached input divided by observed input tokens; it does not infer provider cache eligibility.',
    );
  } else {
    limitations.push(
      'Cache analysis is withheld because input or cached-token evidence is incomplete.',
    );
  }

  if (totalRequests > 0n && requestsByModel.size > 0) {
    const top = [...requestsByModel.entries()].sort((left, right) =>
      left[1] === right[1] ? 0 : left[1] > right[1] ? -1 : 1,
    )[0];
    if (top !== undefined) {
      const share = divide(rational(top[1]), rational(totalRequests));
      if (compare(share, parseDecimal(policy.maximumModelRequestShare)) > 0) {
        opportunities.push(
          freezeOpportunity({
            kind: 'MODEL_CONCENTRATION',
            title: 'Benchmark a lower-cost candidate on the dominant request slice',
            why: 'One model handles more request volume than the configured concentration threshold.',
            test: 'Benchmark a representative eligible slice against a lower-cost candidate using identical examples.',
            qualityGuard:
              'Keep the current model unless the candidate passes every configured quality and latency constraint.',
            evidence: {
              model: top[0],
              requests: String(top[1]),
              requestShare: ratioPercent(share),
              threshold: ratioPercent(
                parseDecimal(policy.maximumModelRequestShare),
              ),
            },
          }),
        );
      }
    }
    limitations.push(
      'Model concentration is based on request volume, not attributed cost.',
    );
  }

  if (excludedCurrency) {
    limitations.push(
      `Records outside ${input.reportingCurrency} are excluded from spend metrics.`,
    );
  }
  if (observedSpend === null) {
    limitations.push(
      'Observed spend is unavailable because no same-currency cost evidence was supplied.',
    );
  }

  return Object.freeze({
    metrics: Object.freeze({
      totalRequests: String(totalRequests),
      observedSpend,
      costPerRequest,
      outputTokensPerRequest,
      cacheHitRatio,
    }),
    opportunities: Object.freeze(opportunities),
    limitations: Object.freeze(limitations),
  });
}

export type BenchmarkDecision =
  | 'TESTED_SAVING'
  | 'QUALITY_FLOOR_FAILED'
  | 'NO_SAVING';

export function benchmarkCandidate(
  input: Readonly<{
    baselineCost: string;
    candidateCost: string;
    baselineQuality: string;
    candidateQuality: string;
    requiredQuality: string;
    currency: string;
  }>,
): Readonly<{
  decision: BenchmarkDecision;
  testedSaving: string | null;
  currency: string;
  limitation: string | null;
}> {
  const baselineCost = parseDecimal(input.baselineCost);
  const candidateCost = parseDecimal(input.candidateCost);
  const candidateQuality = parseDecimal(input.candidateQuality);
  const requiredQuality = parseDecimal(input.requiredQuality);

  if (
    baselineCost.numerator < 0n ||
    candidateCost.numerator < 0n ||
    parseDecimal(input.baselineQuality).numerator < 0n ||
    candidateQuality.numerator < 0n ||
    requiredQuality.numerator < 0n
  ) {
    throw new Error('NEGATIVE_BENCHMARK_VALUE');
  }

  if (compare(candidateQuality, requiredQuality) < 0) {
    return Object.freeze({
      decision: 'QUALITY_FLOOR_FAILED',
      testedSaving: null,
      currency: input.currency,
      limitation:
        'Candidate cost is not promoted to a saving because the required quality floor failed.',
    });
  }

  const saving = subtract(baselineCost, candidateCost);
  if (saving.numerator <= 0n) {
    return Object.freeze({
      decision: 'NO_SAVING',
      testedSaving: null,
      currency: input.currency,
      limitation: 'Candidate passed quality but did not reduce measured cost.',
    });
  }

  return Object.freeze({
    decision: 'TESTED_SAVING',
    testedSaving: formatDecimal(saving, 2),
    currency: input.currency,
    limitation:
      'This is a controlled benchmark result, not verified production savings.',
  });
}

export function verifyComparableSavings(
  input: Readonly<{
    baselineCost: string;
    postChangeCost: string;
    currency: string;
    comparableWorkloadConfirmed: boolean;
  }>,
): Readonly<{
  state: 'VERIFIED' | 'WITHHELD' | 'NO_SAVING';
  verifiedSaving: string | null;
  currency: string;
  limitation: string | null;
}> {
  if (!input.comparableWorkloadConfirmed) {
    return Object.freeze({
      state: 'WITHHELD',
      verifiedSaving: null,
      currency: input.currency,
      limitation:
        'Verification is withheld until the baseline and post-change workload are confirmed comparable.',
    });
  }

  const baseline = parseDecimal(input.baselineCost);
  const post = parseDecimal(input.postChangeCost);
  if (baseline.numerator < 0n || post.numerator < 0n) {
    throw new Error('NEGATIVE_VERIFICATION_COST');
  }

  const saving = subtract(baseline, post);
  if (saving.numerator <= 0n) {
    return Object.freeze({
      state: 'NO_SAVING',
      verifiedSaving: null,
      currency: input.currency,
      limitation:
        'Comparable post-change evidence does not show a positive net saving.',
    });
  }

  return Object.freeze({
    state: 'VERIFIED',
    verifiedSaving: formatDecimal(saving, 2),
    currency: input.currency,
    limitation:
      'Verified here means the user confirmed comparable workload scope; production telemetry remains the stronger continuous-verification level.',
  });
}
