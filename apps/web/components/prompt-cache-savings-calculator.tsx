'use client';

import { useMemo, useState } from 'react';
import {
  add,
  divide,
  formatDecimal,
  multiply,
  parseDecimal,
  rational,
  subtract,
  type Rational,
} from '../../../src/economics/exact';

function parseCount(value: string): bigint | null {
  if (!/^(0|[1-9]\d{0,17})$/.test(value)) return null;
  return BigInt(value);
}

function parseNonNegative(value: string): Rational | null {
  try {
    const parsed = parseDecimal(value);
    return parsed.numerator < 0n ? null : parsed;
  } catch {
    return null;
  }
}

export function PromptCacheSavingsCalculator() {
  const [requests, setRequests] = useState('10000');
  const [cacheableTokens, setCacheableTokens] = useState('1000');
  const [uncachedRate, setUncachedRate] = useState('1');
  const [cachedRate, setCachedRate] = useState('0.1');
  const [hitRate, setHitRate] = useState('80');
  const [currency, setCurrency] = useState('USD');

  const result = useMemo(() => {
    const requestCount = parseCount(requests);
    const tokenCount = parseCount(cacheableTokens);
    const normalRate = parseNonNegative(uncachedRate);
    const discountedRate = parseNonNegative(cachedRate);
    const hitPercent = parseNonNegative(hitRate);
    if (
      requestCount === null ||
      tokenCount === null ||
      normalRate === null ||
      discountedRate === null ||
      hitPercent === null ||
      hitPercent.numerator > 100n * hitPercent.denominator
    ) {
      return null;
    }

    const million = rational(1_000_000n);
    const totalTokens = requestCount * tokenCount;
    const hitShare = divide(hitPercent, rational(100n));
    const missShare = subtract(rational(1n), hitShare);
    const baseline = divide(
      multiply(rational(totalTokens), normalRate),
      million,
    );
    const blendedRate = add(
      multiply(discountedRate, hitShare),
      multiply(normalRate, missShare),
    );
    const cachedCost = divide(
      multiply(rational(totalTokens), blendedRate),
      million,
    );
    const savings = subtract(baseline, cachedCost);

    return {
      totalTokens,
      baseline,
      cachedCost,
      savings,
      annualSavings: multiply(savings, rational(12n)),
    };
  }, [requests, cacheableTokens, uncachedRate, cachedRate, hitRate]);

  return (
    <div className="calculator-shell">
      <form
        className="calculator-form"
        onSubmit={(event) => event.preventDefault()}
      >
        <label>
          <span>Requests per month</span>
          <input
            inputMode="numeric"
            value={requests}
            onChange={(event) => setRequests(event.target.value)}
          />
        </label>
        <label>
          <span>Cacheable input tokens per request</span>
          <input
            inputMode="numeric"
            value={cacheableTokens}
            onChange={(event) => setCacheableTokens(event.target.value)}
          />
        </label>
        <label>
          <span>Uncached input price per 1M tokens</span>
          <input
            inputMode="decimal"
            value={uncachedRate}
            onChange={(event) => setUncachedRate(event.target.value)}
          />
        </label>
        <label>
          <span>Cached input price per 1M tokens</span>
          <input
            inputMode="decimal"
            value={cachedRate}
            onChange={(event) => setCachedRate(event.target.value)}
          />
        </label>
        <label>
          <span>Cache hit rate (%)</span>
          <input
            inputMode="decimal"
            value={hitRate}
            onChange={(event) => setHitRate(event.target.value)}
          />
        </label>
        <label>
          <span>Display currency</span>
          <select
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="INR">INR</option>
          </select>
          <small>No FX conversion is performed.</small>
        </label>
      </form>

      <section className="calculator-results" aria-live="polite">
        {result === null ? (
          <p>
            Enter non-negative prices and a cache hit rate from 0 through 100.
          </p>
        ) : (
          <>
            <div className="metrics-grid">
              <article className="metric-card">
                <span className="metric-label">
                  Potential monthly cache saving
                </span>
                <strong className="metric-value">
                  {currency} {formatDecimal(result.savings, 2)}
                </strong>
              </article>
              <article className="metric-card">
                <span className="metric-label">
                  Baseline cacheable-input cost
                </span>
                <strong className="metric-value">
                  {currency} {formatDecimal(result.baseline, 2)}
                </strong>
              </article>
              <article className="metric-card">
                <span className="metric-label">Estimated blended cost</span>
                <strong className="metric-value">
                  {currency} {formatDecimal(result.cachedCost, 2)}
                </strong>
              </article>
            </div>
            <dl className="calculator-breakdown">
              <div>
                <dt>Annualized potential saving</dt>
                <dd>
                  {currency} {formatDecimal(result.annualSavings, 2)}
                </dd>
              </div>
              <div>
                <dt>Cacheable input tokens / month</dt>
                <dd>{result.totalTokens.toLocaleString('en-US')}</dd>
              </div>
            </dl>
          </>
        )}
      </section>
    </div>
  );
}
