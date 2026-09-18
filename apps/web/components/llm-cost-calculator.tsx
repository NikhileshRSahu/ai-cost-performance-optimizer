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
import { useFxRate } from '../hooks/use-fx-rate';
import { providerPricingPresets } from '../lib/provider-pricing';

type CalculatorResult = Readonly<{
  monthlyInputTokens: bigint;
  monthlyOutputTokens: bigint;
  inputCost: Rational;
  outputCost: Rational;
  monthlyCost: Rational;
  annualCost: Rational;
  costPerRequest: Rational;
}>;

const currencies = ['USD', 'EUR', 'GBP', 'INR'] as const;

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

function convert(value: Rational, fxRate: Rational): Rational {
  return multiply(value, fxRate);
}

const fieldClass =
  'min-h-12 w-full rounded-xl border border-white/[0.08] bg-[#091018] px-3.5 text-sm font-semibold text-white/82 outline-none transition focus:border-cyan-300/30 focus:ring-4 focus:ring-cyan-300/[0.06]';

export function LlmCostCalculator() {
  const [requests, setRequests] = useState('10000');
  const [inputTokens, setInputTokens] = useState('1000');
  const [outputTokens, setOutputTokens] = useState('250');
  const [inputRate, setInputRate] = useState('1');
  const [outputRate, setOutputRate] = useState('4');
  const [rateCurrency, setRateCurrency] = useState('USD');
  const [displayCurrency, setDisplayCurrency] = useState('USD');
  const [pricingPreset, setPricingPreset] = useState('manual');
  const selectedPreset =
    providerPricingPresets.find((preset) => preset.id === pricingPreset) ??
    null;
  const fx = useFxRate(rateCurrency, displayCurrency);

  const result = useMemo(
    () => calculate(requests, inputTokens, outputTokens, inputRate, outputRate),
    [requests, inputTokens, outputTokens, inputRate, outputRate],
  );

  const fxRate = useMemo(() => {
    if (fx.status !== 'ready' && fx.status !== 'identity') return null;
    return parseRate(fx.rate);
  }, [fx]);

  const displayResult = useMemo(() => {
    if (result === null || fxRate === null) return null;
    return {
      ...result,
      inputCost: convert(result.inputCost, fxRate),
      outputCost: convert(result.outputCost, fxRate),
      monthlyCost: convert(result.monthlyCost, fxRate),
      annualCost: convert(result.annualCost, fxRate),
      costPerRequest: convert(result.costPerRequest, fxRate),
    };
  }, [result, fxRate]);

  const metrics =
    displayResult === null
      ? []
      : [
          {
            label: 'Monthly cost',
            value: `${displayCurrency} ${formatDecimal(displayResult.monthlyCost, 2)}`,
            detail: 'Exact workload arithmetic, then explicit FX conversion',
            icon: CircleDollarSign,
          },
          {
            label: 'Annual run rate',
            value: `${displayCurrency} ${formatDecimal(displayResult.annualCost, 2)}`,
            detail: 'Monthly estimate × 12 · not a forecast',
            icon: TrendingUp,
          },
          {
            label: 'Cost / request',
            value: `${displayCurrency} ${formatDecimal(displayResult.costPerRequest, 6)}`,
            detail: 'Based on the request volume above',
            icon: Sparkles,
          },
        ];

  return (
    <section className="grid gap-5 lg:grid-cols-[.94fr_1.06fr] lg:items-start">
      <form
        className="rounded-[24px] border border-white/[0.08] bg-[linear-gradient(145deg,rgba(15,23,33,.96),rgba(8,12,17,.98))] p-5 shadow-[0_24px_70px_rgba(15,23,42,.055)] sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <div className="mb-6 flex items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
          <div>
            <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300/75">
              Workload inputs
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-[-0.025em] text-white">
              Use the rates you actually pay
            </h2>
          </div>
          <div className="grid size-10 place-items-center rounded-xl bg-white/[0.05] text-cyan-300">
            <Calculator className="size-4" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-white/72 sm:col-span-2">
            <span>Provider/model pricing preset</span>
            <select
              className={fieldClass}
              value={pricingPreset}
              onChange={(event) => {
                const id = event.target.value;
                setPricingPreset(id);
                const preset = providerPricingPresets.find(
                  (item) => item.id === id,
                );
                if (preset !== undefined) {
                  setInputRate(preset.inputPerMillionUsd);
                  setOutputRate(preset.outputPerMillionUsd);
                  setRateCurrency('USD');
                }
              }}
            >
              <option value="manual">Manual rates</option>
              {providerPricingPresets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </select>
            <small className="text-xs font-normal leading-5 text-white/34">
              {selectedPreset === null
                ? 'Manual rates are authoritative for your own contract.'
                : `${selectedPreset.provider} source checked ${selectedPreset.asOf}. ${selectedPreset.note}`}
            </small>
            {selectedPreset !== null ? (
              <a
                className="w-fit text-xs font-semibold text-cyan-300/75 underline underline-offset-4"
                href={selectedPreset.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open official pricing source
              </a>
            ) : null}
          </label>

          <label className="grid gap-2 text-sm font-semibold text-white/72">
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
              className="text-xs font-normal text-white/34"
            >
              Whole requests, no commas.
            </small>
          </label>

          <label className="grid gap-2 text-sm font-semibold text-white/72">
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

          <label className="grid gap-2 text-sm font-semibold text-white/72">
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

          <label className="grid gap-2 text-sm font-semibold text-white/72">
            <span>Input price / 1M tokens</span>
            <input
              className={fieldClass}
              inputMode="decimal"
              value={inputRate}
              onChange={(event) => {
                setPricingPreset('manual');
                setInputRate(event.target.value);
              }}
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-white/72">
            <span>Output price / 1M tokens</span>
            <input
              className={fieldClass}
              inputMode="decimal"
              value={outputRate}
              onChange={(event) => {
                setPricingPreset('manual');
                setOutputRate(event.target.value);
              }}
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-white/72">
            <span>Currency of entered rates</span>
            <select
              className={fieldClass}
              value={rateCurrency}
              onChange={(event) => {
                setPricingPreset('manual');
                setRateCurrency(event.target.value);
              }}
            >
              {currencies.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-semibold text-white/72 sm:col-span-2">
            <span>Display results in</span>
            <select
              className={fieldClass}
              value={displayCurrency}
              onChange={(event) => {
                setDisplayCurrency(event.target.value);
              }}
            >
              {currencies.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
            <small className="text-xs font-normal leading-5 text-white/34">
              {rateCurrency === displayCurrency
                ? 'No FX conversion is needed.'
                : fx.status === 'ready'
                  ? `1 ${rateCurrency} = ${fx.rate} ${displayCurrency} · ${fx.source} · ${fx.asOf}`
                  : fx.status === 'error'
                    ? 'FX rate is temporarily unavailable. Results are withheld rather than relabeled.'
                    : 'Loading reference FX rate…'}
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
            Exact arithmetic · explicit currency conversion
          </p>
        </div>

        {result === null ? (
          <div className="p-6 text-sm leading-6 text-white/75">
            Enter non-negative token counts and prices, with at least one
            request per month.
          </div>
        ) : displayResult === null ? (
          <div className="p-6 text-sm leading-6 text-white/75">
            {fx.status === 'error'
              ? 'Currency conversion is unavailable, so converted totals are intentionally withheld.'
              : 'Loading currency conversion…'}
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
                  `${displayCurrency} ${formatDecimal(displayResult.inputCost, 2)}`,
                ],
                [
                  'Output cost',
                  `${displayCurrency} ${formatDecimal(displayResult.outputCost, 2)}`,
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
