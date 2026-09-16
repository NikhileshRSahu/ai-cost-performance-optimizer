'use client';

import {
  Calculator,
  CircleDollarSign,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { motion } from 'framer-motion';
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

const fieldClass =
  'min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-950 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100';

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

  const metrics =
    result === null
      ? []
      : [
          {
            label: 'Monthly cost',
            value: `${currency} ${formatDecimal(result.monthlyCost, 2)}`,
            detail: 'Exact arithmetic from your entered rates',
            icon: CircleDollarSign,
          },
          {
            label: 'Annual run rate',
            value: `${currency} ${formatDecimal(result.annualCost, 2)}`,
            detail: 'Monthly estimate × 12 · not a forecast',
            icon: TrendingUp,
          },
          {
            label: 'Cost / request',
            value: `${currency} ${formatDecimal(result.costPerRequest, 6)}`,
            detail: 'Based on the request volume above',
            icon: Sparkles,
          },
        ];

  return (
    <section className="grid gap-5 lg:grid-cols-[.94fr_1.06fr] lg:items-start">
      <form
        className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,.055)] sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <div className="mb-6 flex items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-700">
              Workload inputs
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-[-0.025em] text-slate-950">
              Use the rates you actually pay
            </h2>
          </div>
          <div className="grid size-10 place-items-center rounded-xl bg-slate-950 text-white">
            <Calculator className="size-4" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-slate-800">
            <span>Requests per month</span>
            <input
              className={fieldClass}
              inputMode="numeric"
              value={requests}
              onChange={(event) => {
                setRequests(event.target.value);
              }}
              aria-describedby="requests-help"
            />
            <small
              id="requests-help"
              className="text-xs font-normal text-slate-500"
            >
              Whole requests, no commas.
            </small>
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-800">
            <span>Average input tokens / request</span>
            <input
              className={fieldClass}
              inputMode="numeric"
              value={inputTokens}
              onChange={(event) => {
                setInputTokens(event.target.value);
              }}
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-800">
            <span>Average output tokens / request</span>
            <input
              className={fieldClass}
              inputMode="numeric"
              value={outputTokens}
              onChange={(event) => {
                setOutputTokens(event.target.value);
              }}
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-800">
            <span>Input price / 1M tokens</span>
            <input
              className={fieldClass}
              inputMode="decimal"
              value={inputRate}
              onChange={(event) => {
                setInputRate(event.target.value);
              }}
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-800">
            <span>Output price / 1M tokens</span>
            <input
              className={fieldClass}
              inputMode="decimal"
              value={outputRate}
              onChange={(event) => {
                setOutputRate(event.target.value);
              }}
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-800">
            <span>Currency of your entered rates</span>
            <select
              className={fieldClass}
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
            <small className="text-xs font-normal leading-5 text-slate-500">
              No FX conversion. Changing this label does not alter the numeric
              rates.
            </small>
          </label>
        </div>
      </form>

      <section
        className="overflow-hidden rounded-[24px] border border-white/10 bg-[#071019] text-white shadow-[0_30px_90px_rgba(15,23,42,.16)]"
        aria-live="polite"
      >
        <div className="border-b border-white/[0.07] px-5 py-4 sm:px-6">
          <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200/70">
            Live economics
          </p>
          <p className="m-0 mt-1 text-sm text-white/70">
            Exact arithmetic · no provider pricing assumptions
          </p>
        </div>

        {result === null ? (
          <div className="p-6 text-sm leading-6 text-white/75">
            Enter non-negative token counts and prices, with at least one
            request per month.
          </div>
        ) : (
          <>
            <div className="grid gap-px bg-white/[0.07] sm:grid-cols-3">
              {metrics.map(({ label, value, detail, icon: Icon }, index) => (
                <motion.article
                  key={label}
                  initial={false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  className="min-w-0 bg-[#071019] p-5"
                >
                  <Icon className="size-4 text-emerald-200/75" />
                  <p className="m-0 mt-6 text-[9px] font-semibold uppercase tracking-[0.13em] text-white/65">
                    {label}
                  </p>
                  <strong className="mt-2 block break-words font-mono text-[clamp(1.45rem,2.1vw,2rem)] font-medium leading-none tracking-[-0.045em] text-white">
                    {value}
                  </strong>
                  <p className="m-0 mt-2 text-[11px] leading-5 text-white/62">
                    {detail}
                  </p>
                </motion.article>
              ))}
            </div>

            <dl className="m-0 grid divide-y divide-white/[0.07] px-5 py-2 sm:px-6">
              {[
                [
                  'Monthly input tokens',
                  result.monthlyInputTokens.toLocaleString('en-US'),
                ],
                [
                  'Monthly output tokens',
                  result.monthlyOutputTokens.toLocaleString('en-US'),
                ],
                [
                  'Input cost',
                  `${currency} ${formatDecimal(result.inputCost, 2)}`,
                ],
                [
                  'Output cost',
                  `${currency} ${formatDecimal(result.outputCost, 2)}`,
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-5 py-3.5 text-sm"
                >
                  <dt className="text-white/65">{label}</dt>
                  <dd className="m-0 font-mono font-semibold text-white/90">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </>
        )}
      </section>
    </section>
  );
}
