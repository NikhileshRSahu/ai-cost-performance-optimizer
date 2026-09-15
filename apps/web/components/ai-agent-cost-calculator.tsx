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

export function AiAgentCostCalculator() {
  const [runs, setRuns] = useState('5000');
  const [callsPerRun, setCallsPerRun] = useState('4');
  const [inputTokens, setInputTokens] = useState('1500');
  const [outputTokens, setOutputTokens] = useState('300');
  const [inputRate, setInputRate] = useState('1');
  const [outputRate, setOutputRate] = useState('4');
  const [toolCostPerRun, setToolCostPerRun] = useState('0');
  const [currency, setCurrency] = useState('USD');

  const result = useMemo(() => {
    const runCount = parseCount(runs);
    const calls = parseCount(callsPerRun);
    const input = parseCount(inputTokens);
    const output = parseCount(outputTokens);
    const inputPrice = parseNonNegative(inputRate);
    const outputPrice = parseNonNegative(outputRate);
    const toolCost = parseNonNegative(toolCostPerRun);
    if (
      runCount === null ||
      runCount === 0n ||
      calls === null ||
      input === null ||
      output === null ||
      inputPrice === null ||
      outputPrice === null ||
      toolCost === null
    ) {
      return null;
    }

    const modelRequests = runCount * calls;
    const million = rational(1_000_000n);
    const modelInputCost = divide(
      multiply(rational(modelRequests * input), inputPrice),
      million,
    );
    const modelOutputCost = divide(
      multiply(rational(modelRequests * output), outputPrice),
      million,
    );
    const modelCost = add(modelInputCost, modelOutputCost);
    const monthlyToolCost = multiply(toolCost, rational(runCount));
    const monthlyCost = add(modelCost, monthlyToolCost);

    return {
      modelRequests,
      modelCost,
      monthlyToolCost,
      monthlyCost,
      costPerRun: divide(monthlyCost, rational(runCount)),
      annualCost: multiply(monthlyCost, rational(12n)),
    };
  }, [
    runs,
    callsPerRun,
    inputTokens,
    outputTokens,
    inputRate,
    outputRate,
    toolCostPerRun,
  ]);

  return (
    <div className="calculator-shell">
      <form
        className="calculator-form"
        onSubmit={(event) => event.preventDefault()}
      >
        <label>
          <span>Agent runs per month</span>
          <input
            inputMode="numeric"
            value={runs}
            onChange={(event) => setRuns(event.target.value)}
          />
        </label>
        <label>
          <span>Model calls per agent run</span>
          <input
            inputMode="numeric"
            value={callsPerRun}
            onChange={(event) => setCallsPerRun(event.target.value)}
          />
        </label>
        <label>
          <span>Input tokens per model call</span>
          <input
            inputMode="numeric"
            value={inputTokens}
            onChange={(event) => setInputTokens(event.target.value)}
          />
        </label>
        <label>
          <span>Output tokens per model call</span>
          <input
            inputMode="numeric"
            value={outputTokens}
            onChange={(event) => setOutputTokens(event.target.value)}
          />
        </label>
        <label>
          <span>Input price per 1M tokens</span>
          <input
            inputMode="decimal"
            value={inputRate}
            onChange={(event) => setInputRate(event.target.value)}
          />
        </label>
        <label>
          <span>Output price per 1M tokens</span>
          <input
            inputMode="decimal"
            value={outputRate}
            onChange={(event) => setOutputRate(event.target.value)}
          />
        </label>
        <label>
          <span>Other tool cost per run</span>
          <input
            inputMode="decimal"
            value={toolCostPerRun}
            onChange={(event) => setToolCostPerRun(event.target.value)}
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
            Enter at least one agent run and non-negative token, price, and
            tool-cost values.
          </p>
        ) : (
          <>
            <div className="metrics-grid">
              <article className="metric-card">
                <span className="metric-label">
                  Estimated monthly agent cost
                </span>
                <strong className="metric-value">
                  {currency} {formatDecimal(result.monthlyCost, 2)}
                </strong>
              </article>
              <article className="metric-card">
                <span className="metric-label">Cost per agent run</span>
                <strong className="metric-value">
                  {currency} {formatDecimal(result.costPerRun, 4)}
                </strong>
              </article>
              <article className="metric-card">
                <span className="metric-label">Annualized run rate</span>
                <strong className="metric-value">
                  {currency} {formatDecimal(result.annualCost, 2)}
                </strong>
              </article>
            </div>
            <dl className="calculator-breakdown">
              <div>
                <dt>Model calls / month</dt>
                <dd>{result.modelRequests.toLocaleString('en-US')}</dd>
              </div>
              <div>
                <dt>Model inference cost</dt>
                <dd>
                  {currency} {formatDecimal(result.modelCost, 2)}
                </dd>
              </div>
              <div>
                <dt>Other tool cost</dt>
                <dd>
                  {currency} {formatDecimal(result.monthlyToolCost, 2)}
                </dd>
              </div>
            </dl>
          </>
        )}
      </section>
    </div>
  );
}
