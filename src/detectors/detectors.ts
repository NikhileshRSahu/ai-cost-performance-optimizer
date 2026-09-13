import {
  add,
  compare,
  divide,
  multiply,
  parseDecimal,
  rational,
  serialize,
  subtract,
  type Rational,
} from '../economics/exact.js';
import type { UsageRecord } from '../usage/contracts.js';
import type {
  DetectorFinding,
  DetectorResult,
  FindingType,
} from './contracts.js';

function result(
  status: DetectorResult['status'],
  finding: DetectorFinding | null,
  reasons: readonly string[] = [],
): DetectorResult {
  return Object.freeze({
    status,
    finding,
    reasons: Object.freeze([...reasons]),
  });
}

function finding(
  id: string,
  type: FindingType,
  measuredFacts: Readonly<Record<string, string>>,
  inference: string,
  recommendation: string,
  notClaimed: string,
): DetectorResult {
  return result(
    'FINDING',
    Object.freeze({
      id,
      type,
      measuredFacts: Object.freeze({ ...measuredFacts }),
      inference,
      recommendation,
      notClaimed,
    }),
  );
}

function fractionText(value: Rational): string {
  const serialized = serialize(value);
  return `${serialized.numerator}/${serialized.denominator}`;
}

function sumCosts(records: readonly UsageRecord[]): Rational {
  return records.reduce(
    (total, record) => add(total, parseDecimal(record.totalCost)),
    rational(0n),
  );
}

function sumNullableMoney(
  records: readonly UsageRecord[],
  key: 'outputCost',
): Rational | null {
  let total = rational(0n);
  for (const record of records) {
    const value = record[key];
    if (value === null) return null;
    total = add(total, parseDecimal(value));
  }
  return total;
}

function sumCount(
  records: readonly UsageRecord[],
  key:
    | 'requests'
    | 'outputTokens'
    | 'cachedInputTokens'
    | 'cacheEligibleInputTokens',
): bigint | null {
  let total = 0n;
  for (const record of records) {
    const value = record[key];
    if (value === null) return null;
    total += BigInt(value);
  }
  return total;
}

function scoped(
  records: readonly UsageRecord[],
  workload: string,
): readonly UsageRecord[] {
  return records.filter((record) => record.workload === workload);
}

export function detectExcessiveOutput(
  input: Readonly<{
    records: readonly UsageRecord[];
    workload: string;
    findingId: string;
    maxOutputTokensPerRequest: string;
    maxOutputCostShare: string;
  }>,
): DetectorResult {
  const records = scoped(input.records, input.workload);
  if (records.length === 0) {
    return result('INSUFFICIENT_EVIDENCE', null, ['WORKLOAD_DATA_MISSING']);
  }
  if (records.some((record) => record.configurationId === null)) {
    return result('INSUFFICIENT_EVIDENCE', null, [
      'CONFIGURATION_ATTRIBUTION_MISSING',
    ]);
  }

  const outputTokens = sumCount(records, 'outputTokens');
  const requests = sumCount(records, 'requests');
  const outputCost = sumNullableMoney(records, 'outputCost');
  const totalCost = sumCosts(records);

  if (
    outputTokens === null ||
    requests === null ||
    requests === 0n ||
    outputCost === null ||
    compare(totalCost, rational(0n)) <= 0
  ) {
    return result('INSUFFICIENT_EVIDENCE', null, [
      'OUTPUT_OR_COST_EVIDENCE_MISSING',
    ]);
  }

  const tokensPerRequest = divide(rational(outputTokens), rational(requests));
  const outputCostShare = divide(outputCost, totalCost);
  const tokensThreshold = parseDecimal(input.maxOutputTokensPerRequest);
  const shareThreshold = parseDecimal(input.maxOutputCostShare);

  if (
    compare(tokensPerRequest, tokensThreshold) <= 0 ||
    compare(outputCostShare, shareThreshold) <= 0
  ) {
    return result('NO_FINDING', null);
  }

  return finding(
    input.findingId,
    'EXCESSIVE_OUTPUT',
    {
      outputTokensPerRequest: fractionText(tokensPerRequest),
      outputCostShare: fractionText(outputCostShare),
      totalCost: fractionText(totalCost),
    },
    'Output volume and output-cost share exceed the configured workload thresholds.',
    'Benchmark a lower output limit or more concise configuration on the same workload.',
    'Shorter output is not assumed to preserve workload quality.',
  );
}

export function detectRetryRepeatedCall(
  input: Readonly<{
    records: readonly UsageRecord[];
    workload: string;
    findingId: string;
  }>,
): DetectorResult {
  const records = scoped(input.records, input.workload);
  if (records.length === 0) {
    return result('INSUFFICIENT_EVIDENCE', null, ['WORKLOAD_DATA_MISSING']);
  }
  if (
    records.some(
      (record) =>
        record.granularity !== 'REQUEST' ||
        record.operationId === null ||
        record.attemptNumber === null,
    )
  ) {
    return result('INSUFFICIENT_EVIDENCE', null, [
      'REQUEST_ATTEMPT_EVIDENCE_REQUIRED',
    ]);
  }

  const repeated = records.filter(
    (record) => BigInt(record.attemptNumber ?? '1') > 1n,
  );
  if (repeated.length === 0) return result('NO_FINDING', null);

  const repeatedCost = sumCosts(repeated);
  return finding(
    input.findingId,
    'RETRY_REPEATED_CALL',
    {
      repeatedAttempts: String(repeated.length),
      repeatedAttemptCost: fractionText(repeatedCost),
    },
    'Repeated attempts consume measurable cost for stable operation identifiers.',
    'Inspect retry causes and benchmark a bounded retry or timeout policy.',
    'Repeated attempts are not assumed to be unnecessary or wasteful.',
  );
}

export function detectPromptCaching(
  input: Readonly<{
    records: readonly UsageRecord[];
    workload: string;
    findingId: string;
    minimumCacheHitRatio: string;
  }>,
): DetectorResult {
  const records = scoped(input.records, input.workload);
  if (records.length === 0) {
    return result('INSUFFICIENT_EVIDENCE', null, ['WORKLOAD_DATA_MISSING']);
  }

  const eligible = sumCount(records, 'cacheEligibleInputTokens');
  const cached = sumCount(records, 'cachedInputTokens');
  if (eligible === null || cached === null || eligible === 0n) {
    return result('INSUFFICIENT_EVIDENCE', null, [
      'CACHE_ELIGIBILITY_EVIDENCE_MISSING',
    ]);
  }

  const hitRatio = divide(rational(cached), rational(eligible));
  if (compare(hitRatio, parseDecimal(input.minimumCacheHitRatio)) >= 0) {
    return result('NO_FINDING', null);
  }

  return finding(
    input.findingId,
    'PROMPT_CACHING',
    {
      cacheEligibleInputTokens: String(eligible),
      cachedInputTokens: String(cached),
      cacheHitRatio: fractionText(hitRatio),
    },
    'Measured cached-token coverage is below the configured threshold for explicitly cache-eligible input.',
    'Test provider-supported caching while holding the workload constant.',
    'Cache eligibility is not inferred from aggregate input-token counts alone.',
  );
}

export function detectModelRightSizing(
  input: Readonly<{
    records: readonly UsageRecord[];
    workload: string;
    findingId: string;
    candidateConfigurationId: string;
    candidateComparableCost: string;
  }>,
): DetectorResult {
  const records = scoped(input.records, input.workload);
  if (
    records.length === 0 ||
    records.some(
      (record) => record.model.length === 0 || record.configurationId === null,
    )
  ) {
    return result('INSUFFICIENT_EVIDENCE', null, [
      'MODEL_OR_CONFIGURATION_ATTRIBUTION_MISSING',
    ]);
  }

  const baselineCost = sumCosts(records);
  const candidateCost = parseDecimal(input.candidateComparableCost);
  const saving = subtract(baselineCost, candidateCost);
  if (compare(saving, rational(0n)) <= 0) return result('NO_FINDING', null);

  const requests = records.reduce(
    (total, record) => total + BigInt(record.requests),
    0n,
  );

  return finding(
    input.findingId,
    'MODEL_RIGHT_SIZING',
    {
      eligibleRequests: String(requests),
      baselineCost: fractionText(baselineCost),
      candidateComparableCost: fractionText(candidateCost),
      potentialComparableSaving: fractionText(saving),
      candidateConfigurationId: input.candidateConfigurationId,
    },
    'A lower-cost candidate configuration is economically material on the same eligible volume.',
    'Run the workload benchmark against the candidate configuration.',
    'Acceptable candidate quality is not claimed before benchmark evidence.',
  );
}

function median(values: readonly Rational[]): Rational {
  const sorted = [...values].sort((a, b) => compare(a, b));
  if (sorted.length === 0) throw new Error('MEDIAN_REQUIRES_VALUES');
  const middle = Math.floor(sorted.length / 2);
  const upper = sorted[middle];
  if (upper === undefined) throw new Error('MEDIAN_INDEX_MISSING');
  if (sorted.length % 2 === 1) return upper;
  const lower = sorted[middle - 1];
  if (lower === undefined) throw new Error('MEDIAN_INDEX_MISSING');
  return divide(add(lower, upper), rational(2n));
}

function absolute(value: Rational): Rational {
  return value.numerator < 0n
    ? rational(-value.numerator, value.denominator)
    : value;
}

export function detectCostAnomaly(
  input: Readonly<{
    history: readonly Readonly<{ date: string; cost: string }>[];
    current: Readonly<{ date: string; cost: string }>;
    findingId: string;
    materialityThreshold: string;
    stableScope: boolean;
  }>,
): DetectorResult {
  if (!input.stableScope) {
    return result('INSUFFICIENT_EVIDENCE', null, ['STABLE_SCOPE_REQUIRED']);
  }
  if (input.history.some((entry) => entry.date === input.current.date)) {
    return result('INSUFFICIENT_EVIDENCE', null, [
      'ASSESSED_DAY_MUST_BE_EXCLUDED_FROM_HISTORY',
    ]);
  }
  if (input.history.length < 14) {
    return result('INSUFFICIENT_EVIDENCE', null, [
      'FOURTEEN_PRIOR_DAYS_REQUIRED',
    ]);
  }

  const history = input.history.map((entry) => parseDecimal(entry.cost));
  const current = parseDecimal(input.current.cost);
  const historicalMedian = median(history);
  const deviations = history.map((cost) =>
    absolute(subtract(cost, historicalMedian)),
  );
  const mad = median(deviations);
  const increase = subtract(current, historicalMedian);
  const threshold = parseDecimal(input.materialityThreshold);

  if (compare(increase, threshold) <= 0) return result('NO_FINDING', null);

  if (compare(mad, rational(0n)) === 0) {
    const historicalMax = history.reduce((max, value) =>
      compare(value, max) > 0 ? value : max,
    );
    if (compare(current, historicalMax) <= 0) return result('NO_FINDING', null);

    return finding(
      input.findingId,
      'COST_ANOMALY',
      {
        currentDailyCost: fractionText(current),
        historicalMedian: fractionText(historicalMedian),
        mad: '0/1',
      },
      'Current daily cost is above both the materiality threshold and the prior comparable maximum.',
      'Investigate the scope and drivers of the cost increase.',
      'A cost anomaly is not a savings claim.',
    );
  }

  const robustZ = divide(multiply(rational(6745n, 10000n), increase), mad);
  if (compare(robustZ, rational(7n, 2n)) < 0) {
    return result('NO_FINDING', null);
  }

  return finding(
    input.findingId,
    'COST_ANOMALY',
    {
      currentDailyCost: fractionText(current),
      historicalMedian: fractionText(historicalMedian),
      mad: fractionText(mad),
      robustZ: fractionText(robustZ),
    },
    'Current daily cost is a robust statistical outlier and exceeds the configured materiality threshold.',
    'Investigate the scope and drivers of the cost increase.',
    'A cost anomaly is not a savings claim.',
  );
}
