import {
  add,
  divide,
  formatDecimal,
  parseDecimal,
  rational,
  serialize,
  type Rational,
} from '../economics/exact.js';
import type {
  ProviderCostEvidence,
  ProviderUsageEvidence,
} from '../ingestion/provider-evidence.js';

export type ProviderEvidenceFact = Readonly<{
  key:
    | 'COST_PER_REQUEST'
    | 'OUTPUT_TOKENS_PER_REQUEST'
    | 'CACHED_INPUT_TOKEN_SHARE';
  label: string;
  value: string;
  evidence: Readonly<Record<string, string>>;
}>;

export type ProviderEvidenceDiagnosis = Readonly<{
  observedSpend: Readonly<{
    amount: string;
    currency: string;
    evidenceRef: string;
  }> | null;
  facts: readonly ProviderEvidenceFact[];
  limitations: readonly string[];
}>;

function fraction(value: Rational): string {
  const exact = serialize(value);
  return `${exact.numerator}/${exact.denominator}`;
}

function sumCosts(costs: readonly ProviderCostEvidence[]): Rational {
  return costs.reduce(
    (total, item) => add(total, parseDecimal(item.amount)),
    rational(0n),
  );
}

function sumCounts(
  usage: readonly ProviderUsageEvidence[],
  key: 'requests' | 'inputTokens' | 'outputTokens' | 'cachedInputTokens',
): bigint {
  return usage.reduce((total, item) => total + BigInt(item[key]), 0n);
}

function fact(
  key: ProviderEvidenceFact['key'],
  label: string,
  value: string,
  evidence: Readonly<Record<string, string>>,
): ProviderEvidenceFact {
  return Object.freeze({
    key,
    label,
    value,
    evidence: Object.freeze({ ...evidence }),
  });
}

export function diagnoseProviderEvidence(
  input: Readonly<{
    usage: readonly ProviderUsageEvidence[];
    costs: readonly ProviderCostEvidence[];
    reportingCurrency: string;
  }>,
): ProviderEvidenceDiagnosis {
  const matchingCosts = input.costs.filter(
    (item) => item.currency === input.reportingCurrency,
  );
  const limitations: string[] = [
    'Model-level cost attribution is withheld because provider billing evidence is not model-scoped.',
  ];
  const facts: ProviderEvidenceFact[] = [];

  if (matchingCosts.length !== input.costs.length) {
    limitations.push(
      'Provider cost evidence outside the reporting currency is excluded from financial facts.',
    );
  }

  const totalCost = sumCosts(matchingCosts);
  const requests = sumCounts(input.usage, 'requests');

  const observedSpend =
    matchingCosts.length === 0
      ? null
      : Object.freeze({
          amount: formatDecimal(totalCost, 2),
          currency: input.reportingCurrency,
          evidenceRef: `provider-cost:${matchingCosts[0]?.fingerprint ?? 'unknown'}`,
        });

  if (observedSpend !== null && requests > 0n) {
    const perRequest = divide(totalCost, rational(requests));
    facts.push(
      fact(
        'COST_PER_REQUEST',
        'Cost per request',
        `${input.reportingCurrency} ${formatDecimal(perRequest, 6)}`,
        {
          exactCostPerRequest: fraction(perRequest),
          requests: String(requests),
          costRecords: String(matchingCosts.length),
        },
      ),
    );
  } else if (requests === 0n) {
    limitations.push(
      'Cost per request is withheld because provider request volume is zero.',
    );
  } else {
    limitations.push(
      'Cost per request is withheld because provider billing evidence is unavailable in the reporting currency.',
    );
  }

  if (requests > 0n) {
    const outputTokens = sumCounts(input.usage, 'outputTokens');
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
  }

  const inputTokens = sumCounts(input.usage, 'inputTokens');
  const cachedInputTokens = sumCounts(input.usage, 'cachedInputTokens');
  if (inputTokens > 0n) {
    const share = divide(rational(cachedInputTokens), rational(inputTokens));
    facts.push(
      fact(
        'CACHED_INPUT_TOKEN_SHARE',
        'Cached input token share',
        `${formatDecimal(divide(share, rational(1n, 100n)), 2)}%`,
        {
          cachedInputTokens: String(cachedInputTokens),
          inputTokens: String(inputTokens),
          exactCachedInputTokenShare: fraction(share),
        },
      ),
    );
  } else {
    limitations.push(
      'Cached-input efficiency is withheld because provider input-token volume is zero.',
    );
  }

  return Object.freeze({
    observedSpend,
    facts: Object.freeze(facts),
    limitations: Object.freeze(limitations),
  });
}
