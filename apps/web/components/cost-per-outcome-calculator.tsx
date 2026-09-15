'use client';

import { useMemo, useState } from 'react';
import {
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

export function CostPerOutcomeCalculator() {
  const [monthlyCost, setMonthlyCost] = useState('1000');
  const [requests, setRequests] = useState('10000');
  const [successRate, setSuccessRate] = useState('80');
  const [currency, setCurrency] = useState('USD');

  const result = useMemo(() => {
    const cost = parseNonNegative(monthlyCost);
    const count = parseCount(requests);
    const percent = parseNonNegative(successRate);
    if (cost === null || count === null || count === 0n || percent === null) {
      return null;
    }
    if (percent.numerator > 100n * percent.denominator) return null;

    const rate = divide(percent, rational(100n));
    const successful = multiply(rational(count), rate);
    if (successful.numerator === 0n) return null;

    const costPerRequest = divide(cost, rational(count));
    const costPerSuccess = divide(cost, successful);
    const unsuccessfulShare = subtract(rational(1n), rate);

    return {
      successful,
      costPerRequest,
      costPerSuccess,
      impliedUnsuccessfulSpend: multiply(cost, unsuccessfulShare),
    };
  }, [monthlyCost, requests, successRate]);

  return (
    <div className="calculator-shell">
      <form
        className="calculator-form"
        onSubmit={(event) => event.preventDefault()}
      >
        <label>
          <span>Monthly AI cost</span>
          <input
            inputMode="decimal"
            value={monthlyCost}
            onChange={(event) => setMonthlyCost(event.target.value)}
          />
        </label>
        <label>
          <span>Requests per month</span>
          <input
            inputMode="numeric"
            value={requests}
            onChange={(event) => setRequests(event.target.value)}
          />
        </label>
        <label>
          <span>Successful outcome rate (%)</span>
          <input
            inputMode="decimal"
            value={successRate}
            onChange={(event) => setSuccessRate(event.target.value)}
          />
          <small>Enter a value from 0 through 100.</small>
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
            Enter a positive request count and a successful outcome rate above
            0% and at most 100%.
          </p>
        ) : (
          <>
            <div className="metrics-grid">
              <article className="metric-card">
                <span className="metric-label">
                  Cost per successful outcome
                </span>
                <strong className="metric-value">
                  {currency} {formatDecimal(result.costPerSuccess, 4)}
                </strong>
              </article>
              <article className="metric-card">
                <span className="metric-label">Cost per request</span>
                <strong className="metric-value">
                  {currency} {formatDecimal(result.costPerRequest, 4)}
                </strong>
              </article>
              <article className="metric-card">
                <span className="metric-label">Successful outcomes</span>
                <strong className="metric-value">
                  {formatDecimal(result.successful, 2)}
                </strong>
              </article>
            </div>
            <dl className="calculator-breakdown">
              <div>
                <dt>Implied spend on unsuccessful requests</dt>
                <dd>
                  {currency} {formatDecimal(result.impliedUnsuccessfulSpend, 2)}
                </dd>
              </div>
            </dl>
          </>
        )}
      </section>
    </div>
  );
}
