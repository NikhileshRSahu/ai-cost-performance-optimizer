import {
  add,
  divide,
  formatDecimal,
  parseDecimal,
  rational,
  serialize,
  type Rational,
} from '../economics/exact.js';
import type { UsageRecord } from '../usage/contracts.js';

export type UsageDiagnosisFact = Readonly<{
  key:
    | 'TOTAL_SPEND'
    | 'COST_PER_REQUEST'
    | 'COST_PER_SUCCESS'
    | 'TOP_MODEL_COST_SHARE'
    | 'RETRY_ATTEMPT_COST'
    | 'OUTPUT_TOKENS_PER_REQUEST'
    | 'CACHE_HIT_RATIO';
  label: string;
  value: string;
  evidence: Readonly<Record<string, string>>;
}>;

export type UsageDiagnosis = Readonly<{
  reportingCurrency: string;
  includedRecords: number;
  excludedCurrencyRecords: number;
  facts: readonly UsageDiagnosisFact[];
  limitations: readonly string[];
}>;

function sumCost(records: readonly UsageRecord[]): Rational {
  return records.reduce(
    (total, record) => add(total, parseDecimal(record.totalCost)),
    rational(0n),
  );
}

function sumRequiredCount(
  records: readonly UsageRecord[],
  key: 'requests',
): bigint {
  return records.reduce((total, record) => total + BigInt(record[key]), 0n);
}

function sumOptionalCount(
  records: readonly UsageRecord[],
  key:
    | 'successes'
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

function fraction(value: Rational): string {
  const exact = serialize(value);
  return `${exact.numerator}/${exact.denominator}`;
}

function fact(
  key: UsageDiagnosisFact['key'],
  label: string,
  value: string,
  evidence: Readonly<Record<string, string>>,
): UsageDiagnosisFact {
  return Object.freeze({
    key,
    label,
    value,
    evidence: Object.freeze({ ...evidence }),
  });
}

export function diagnoseUsage(
  input: Readonly<{
    records: readonly UsageRecord[];
    reportingCurrency: string;
  }>,
): UsageDiagnosis {
  const included = input.records.filter(
    (record) => record.currency === input.reportingCurrency,
  );
  const excludedCurrencyRecords = input.records.length - included.length;
  const facts: UsageDiagnosisFact[] = [];
  const limitations: string[] = [];

  if (included.length === 0) {
    return Object.freeze({
      reportingCurrency: input.reportingCurrency,
      includedRecords: 0,
      excludedCurrencyRecords,
      facts: Object.freeze([]),
      limitations: Object.freeze([
        'No records match the reporting currency, so financial diagnosis is withheld.',
      ]),
    });
  }

  const totalCost = sumCost(included);
  const requests = sumRequiredCount(included, 'requests');

  facts.push(
    fact(
      'TOTAL_SPEND',
      'Observed AI spend',
      `${input.reportingCurrency} ${formatDecimal(totalCost, 2)}`,
      {
        exactCost: fraction(totalCost),
        records: String(included.length),
      },
    ),
  );

  if (requests > 0n) {
    const costPerRequest = divide(totalCost, rational(requests));
    facts.push(
      fact(
        'COST_PER_REQUEST',
        'Cost per request',
        `${input.reportingCurrency} ${formatDecimal(costPerRequest, 6)}`,
        {
          exactCostPerRequest: fraction(costPerRequest),
          requests: String(requests),
        },
      ),
    );
  } else {
    limitations.push(
      'Cost per request is withheld because request volume is zero.',
    );
  }

  const successes = sumOptionalCount(included, 'successes');
  if (successes !== null && successes > 0n) {
    const costPerSuccess = divide(totalCost, rational(successes));
    facts.push(
      fact(
        'COST_PER_SUCCESS',
        'Cost per successful outcome',
        `${input.reportingCurrency} ${formatDecimal(costPerSuccess, 6)}`,
        {
          exactCostPerSuccess: fraction(costPerSuccess),
          successfulOutcomes: String(successes),
        },
      ),
    );
  } else {
    limitations.push(
      'Cost per successful outcome is withheld until a complete, non-zero success denominator is available.',
    );
  }

  const modelCosts = new Map<string, Rational>();
  for (const record of included) {
    modelCosts.set(
      record.model,
      add(
        modelCosts.get(record.model) ?? rational(0n),
        parseDecimal(record.totalCost),
      ),
    );
  }
  const topModel = [...modelCosts.entries()].sort((a, b) => {
    const left = a[1].numerator * b[1].denominator;
    const right = b[1].numerator * a[1].denominator;
    return left === right ? 0 : left > right ? -1 : 1;
  })[0];

  if (topModel !== undefined && totalCost.numerator > 0n) {
    const share = divide(topModel[1], totalCost);
    facts.push(
      fact(
        'TOP_MODEL_COST_SHARE',
        'Top model cost concentration',
        `${topModel[0]} · ${formatDecimal(
          divide(share, rational(1n, 100n)),
          2,
        )}%`,
        {
          model: topModel[0],
          exactShare: fraction(share),
          exactModelCost: fraction(topModel[1]),
        },
      ),
    );
  }

  const retryEvidenceComplete = included.every(
    (record) =>
      record.granularity === 'REQUEST' && record.attemptNumber !== null,
  );
  if (retryEvidenceComplete) {
    const repeated = included.filter(
      (record) => BigInt(record.attemptNumber ?? '1') > 1n,
    );
    if (repeated.length > 0) {
      const repeatedCost = sumCost(repeated);
      facts.push(
        fact(
          'RETRY_ATTEMPT_COST',
          'Repeated-attempt cost',
          `${input.reportingCurrency} ${formatDecimal(repeatedCost, 2)}`,
          {
            repeatedAttempts: String(repeated.length),
            exactRepeatedAttemptCost: fraction(repeatedCost),
          },
        ),
      );
    }
  } else {
    limitations.push(
      'Retry cost is withheld because request-level attempt evidence is incomplete.',
    );
  }

  const outputTokens = sumOptionalCount(included, 'outputTokens');
  if (outputTokens !== null && requests > 0n) {
    const perRequest = divide(rational(outputTokens), rational(requests));
    facts.push(
      fact(
        'OUTPUT_TOKENS_PER_REQUEST',
        'Output tokens per request',
        formatDecimal(perRequest, 2),
        {
          outputTokens: String(outputTokens),
          requests: String(requests),
          exactOutputTokensPerRequest: fraction(perRequest),
        },
      ),
    );
  } else {
    limitations.push(
      'Output-token efficiency is withheld because output-token evidence is incomplete.',
    );
  }

  const cacheEligible = sumOptionalCount(included, 'cacheEligibleInputTokens');
  const cached = sumOptionalCount(included, 'cachedInputTokens');
  if (cacheEligible !== null && cached !== null && cacheEligible > 0n) {
    const hitRatio = divide(rational(cached), rational(cacheEligible));
    facts.push(
      fact(
        'CACHE_HIT_RATIO',
        'Cache hit ratio',
        `${formatDecimal(divide(hitRatio, rational(1n, 100n)), 2)}%`,
        {
          cachedInputTokens: String(cached),
          cacheEligibleInputTokens: String(cacheEligible),
          exactHitRatio: fraction(hitRatio),
        },
      ),
    );
  } else {
    limitations.push(
      'Cache efficiency is withheld until complete cache-eligible and cached-token evidence exists.',
    );
  }

  if (excludedCurrencyRecords > 0) {
    limitations.push(
      'Records outside the reporting currency are excluded from financial diagnosis.',
    );
  }

  return Object.freeze({
    reportingCurrency: input.reportingCurrency,
    includedRecords: included.length,
    excludedCurrencyRecords,
    facts: Object.freeze(facts),
    limitations: Object.freeze(limitations),
  });
}
