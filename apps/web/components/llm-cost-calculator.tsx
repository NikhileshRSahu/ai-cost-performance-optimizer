'use client';

import { useMemo, useState } from 'react';
import {
  add,
  divide,
  formatDecimal,
  multiply,
  parseDecimal,
  rational,
  type Rational,
} from '../../../src/economics/exact';

type CalculatorResult = Readonly<{
  monthlyInputTokens: bigint;
  monthlyOutputTokens: bigint;
  inputCost: Rational;
  outputCost: Rational;
  monthlyCost: Rational;
  annualCost: Rational;
  costPerRequest: Rational;
}>;

function parseCount(value: string): bigint | null {
  if (!/^(0|[1-9]\d{0,17})$/.test(value)) return null;
  return BigInt(value);
}

function parseRate(value: string): Rational | null {
  try {
    const rate = parseDecimal(value);
    return rate.numerator < 0n ? null : rate;
  } catch {
    return null;
  }
}

function calculate(
  requestsValue: string,
  inputTokensValue: string,
  outputTokensValue: string,
  inputRateValue: string,
  outputRateValue: string,
): CalculatorResult | null {
  const requests = parseCount(requestsValue);
  const inputTokens = parseCount(inputTokensValue);
  const outputTokens = parseCount(outputTokensValue);
  const inputRate = parseRate(inputRateValue);
  const outputRate = parseRate(outputRateValue);

  if (
    requests === null ||
    inputTokens === null ||
    outputTokens === null ||
    inputRate === null ||
    outputRate === null ||
    requests === 0n
  ) {
    return null;
  }

  const million = rational(1_000_000n);
  const monthlyInputTokens = requests * inputTokens;
  const monthlyOutputTokens = requests * outputTokens;
  const inputCost = divide(
    multiply(rational(monthlyInputTokens), inputRate),
    million,
  );
  const outputCost = divide(
    multiply(rational(monthlyOutputTokens), outputRate),
    million,
  );
  const monthlyCost = add(inputCost, outputCost);

  return Object.freeze({
    monthlyInputTokens,
    monthlyOutputTokens,
    inputCost,
    outputCost,
    monthlyCost,
    annualCost: multiply(monthlyCost, rational(12n)),
    costPerRequest: divide(monthlyCost, rational(requests)),
  });
}

export function LlmCostCalculator() {
  const [requests, setRequests] = useState('10000');
  const [inputTokens, setInputTokens] = useState('1000');
  const [outputTokens, setOutputTokens] = useState('250');
  const [inputRate, setInputRate] = useState('1');
  const [outputRate, setOutputRate] = useState('4');
  const [currency, setCurrency] = useState('USD');

  const result = useMemo(
    () => calculate(requests, inputTokens, outputTokens, inputRate, outputRate),
    [requests, inputTokens, outputTokens, inputRate, outputRate],
  );

  return (
    <div className="calculator-shell">
      <form
        className="calculator-form"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <label>
          <span>Requests per month</span>
          <input
            inputMode="numeric"
            value={requests}
            onChange={(event) => {
              setRequests(event.target.value);
            }}
            aria-describedby="requests-help"
          />
          <small id="requests-help">Whole requests, no commas.</small>
        </label>

        <label>
          <span>Average input tokens per request</span>
          <input
            inputMode="numeric"
            value={inputTokens}
            onChange={(event) => {
              setInputTokens(event.target.value);
            }}
          />
        </label>

        <label>
          <span>Average output tokens per request</span>
          <input
            inputMode="numeric"
            value={outputTokens}
            onChange={(event) => {
              setOutputTokens(event.target.value);
            }}
          />
        </label>

        <label>
          <span>Input price per 1M tokens</span>
          <input
            inputMode="decimal"
            value={inputRate}
            onChange={(event) => {
              setInputRate(event.target.value);
            }}
          />
        </label>

        <label>
          <span>Output price per 1M tokens</span>
          <input
            inputMode="decimal"
            value={outputRate}
            onChange={(event) => {
              setOutputRate(event.target.value);
            }}
          />
        </label>

        <label>
          <span>Currency of the token rates you entered</span>
          <select
            value={currency}
            onChange={(event) => {
              setCurrency(event.target.value);
            }}
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="INR">INR</option>
          </select>
          <small>
            Label only. Changing this does not convert the numeric rates.
          </small>
        </label>
      </form>

      <section className="calculator-results" aria-live="polite">
        {result === null ? (
          <p>
            Enter non-negative token counts and prices, with at least one
            request per month.
          </p>
        ) : (
          <>
            <div className="metrics-grid">
              <article className="metric-card">
                <span className="metric-label">Estimated monthly cost</span>
                <strong className="metric-value">
                  {currency} {formatDecimal(result.monthlyCost, 2)}
                </strong>
                <span className="metric-detail">
                  Exact arithmetic from the rates you entered.
                </span>
              </article>
              <article className="metric-card">
                <span className="metric-label">Annualized run rate</span>
                <strong className="metric-value">
                  {currency} {formatDecimal(result.annualCost, 2)}
                </strong>
                <span className="metric-detail">
                  Monthly estimate × 12. Not a forecast.
                </span>
              </article>
              <article className="metric-card">
                <span className="metric-label">Cost per request</span>
                <strong className="metric-value">
                  {currency} {formatDecimal(result.costPerRequest, 6)}
                </strong>
                <span className="metric-detail">
                  Based on the request volume entered above.
                </span>
              </article>
            </div>

            <dl className="calculator-breakdown">
              <div>
                <dt>Monthly input tokens</dt>
                <dd>{result.monthlyInputTokens.toLocaleString('en-US')}</dd>
              </div>
              <div>
                <dt>Monthly output tokens</dt>
                <dd>{result.monthlyOutputTokens.toLocaleString('en-US')}</dd>
              </div>
              <div>
                <dt>Input cost</dt>
                <dd>
                  {currency} {formatDecimal(result.inputCost, 2)}
                </dd>
              </div>
              <div>
                <dt>Output cost</dt>
                <dd>
                  {currency} {formatDecimal(result.outputCost, 2)}
                </dd>
              </div>
            </dl>
          </>
        )}
      </section>
    </div>
  );
}
