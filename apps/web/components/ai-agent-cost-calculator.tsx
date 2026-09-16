'use client';

import { Bot, CircleDollarSign, Wrench } from 'lucide-react';
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

const currencies = ['USD', 'EUR', 'GBP', 'INR'] as const;
const fieldClass =
  'min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-950 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100';

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
  const [rateCurrency, setRateCurrency] = useState('USD');
  const [displayCurrency, setDisplayCurrency] = useState('USD');
  const fx = useFxRate(rateCurrency, displayCurrency);

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

  const fxRate = useMemo(() => {
    if (fx.status !== 'ready' && fx.status !== 'identity') return null;
    return parseNonNegative(fx.rate);
  }, [fx]);

  const converted = useMemo(() => {
    if (result === null || fxRate === null) return null;
    return {
      ...result,
      modelCost: multiply(result.modelCost, fxRate),
      monthlyToolCost: multiply(result.monthlyToolCost, fxRate),
      monthlyCost: multiply(result.monthlyCost, fxRate),
      costPerRun: multiply(result.costPerRun, fxRate),
      annualCost: multiply(result.annualCost, fxRate),
    };
  }, [result, fxRate]);

  return (
    <section className="grid gap-5 lg:grid-cols-[.94fr_1.06fr] lg:items-start">
      <form
        className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,.055)] sm:p-6"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="mb-6 flex items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-700">
              Agent workload inputs
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-[-0.025em] text-slate-950">
              Model calls plus tool cost
            </h2>
          </div>
          <div className="grid size-10 place-items-center rounded-xl bg-slate-950 text-white">
            <Bot className="size-4" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-slate-800">
            <span>Agent runs per month</span>
            <input className={fieldClass} inputMode="numeric" value={runs} onChange={(e) => setRuns(e.target.value)} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-800">
            <span>Model calls per agent run</span>
            <input className={fieldClass} inputMode="numeric" value={callsPerRun} onChange={(e) => setCallsPerRun(e.target.value)} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-800">
            <span>Input tokens per model call</span>
            <input className={fieldClass} inputMode="numeric" value={inputTokens} onChange={(e) => setInputTokens(e.target.value)} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-800">
            <span>Output tokens per model call</span>
            <input className={fieldClass} inputMode="numeric" value={outputTokens} onChange={(e) => setOutputTokens(e.target.value)} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-800">
            <span>Input price / 1M tokens</span>
            <input className={fieldClass} inputMode="decimal" value={inputRate} onChange={(e) => setInputRate(e.target.value)} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-800">
            <span>Output price / 1M tokens</span>
            <input className={fieldClass} inputMode="decimal" value={outputRate} onChange={(e) => setOutputRate(e.target.value)} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-800">
            <span>Other tool cost per run</span>
            <input className={fieldClass} inputMode="decimal" value={toolCostPerRun} onChange={(e) => setToolCostPerRun(e.target.value)} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-800">
            <span>Currency of entered rates</span>
            <select className={fieldClass} value={rateCurrency} onChange={(e) => setRateCurrency(e.target.value)}>
              {currencies.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-800 sm:col-span-2">
            <span>Display results in</span>
            <select className={fieldClass} value={displayCurrency} onChange={(e) => setDisplayCurrency(e.target.value)}>
              {currencies.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
            </select>
            <small className="text-xs font-normal leading-5 text-slate-500">
              {rateCurrency === displayCurrency
                ? 'No FX conversion is needed.'
                : fx.status === 'ready'
                  ? `1 ${rateCurrency} = ${fx.rate} ${displayCurrency} · ${fx.source} · ${fx.asOf}`
                  : fx.status === 'error'
                    ? 'FX rate is temporarily unavailable. Converted results are withheld.'
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
            Agent economics
          </p>
          <p className="m-0 mt-1 text-sm text-white/70">
            Model inference and entered tool costs only
          </p>
        </div>

        {result === null ? (
          <div className="p-6 text-sm leading-6 text-white/75">
            Enter at least one agent run and non-negative token, price, and tool-cost values.
          </div>
        ) : converted === null ? (
          <div className="p-6 text-sm leading-6 text-white/75">
            {fx.status === 'error'
              ? 'Currency conversion is unavailable, so converted totals are intentionally withheld.'
              : 'Loading currency conversion…'}
          </div>
        ) : (
          <>
            <div className="grid gap-px bg-white/[0.07] sm:grid-cols-3">
              <article className="min-w-0 bg-[#071019] p-5">
                <CircleDollarSign className="size-4 text-emerald-200/75" />
                <p className="m-0 mt-6 text-[9px] font-semibold uppercase tracking-[0.13em] text-white/65">
                  Estimated monthly agent cost
                </p>
                <strong className="mt-2 block font-mono text-[clamp(1.45rem,2.1vw,2rem)] font-medium leading-none tracking-[-0.045em] text-white">
                  {displayCurrency} {formatDecimal(converted.monthlyCost, 2)}
                </strong>
              </article>
              <article className="min-w-0 bg-[#071019] p-5">
                <Bot className="size-4 text-emerald-200/75" />
                <p className="m-0 mt-6 text-[9px] font-semibold uppercase tracking-[0.13em] text-white/65">
                  Cost per agent run
                </p>
                <strong className="mt-2 block font-mono text-[clamp(1.45rem,2.1vw,2rem)] font-medium leading-none tracking-[-0.045em] text-white">
                  {displayCurrency} {formatDecimal(converted.costPerRun, 4)}
                </strong>
              </article>
              <article className="min-w-0 bg-[#071019] p-5">
                <CircleDollarSign className="size-4 text-emerald-200/75" />
                <p className="m-0 mt-6 text-[9px] font-semibold uppercase tracking-[0.13em] text-white/65">
                  Annualized run rate
                </p>
                <strong className="mt-2 block font-mono text-[clamp(1.45rem,2.1vw,2rem)] font-medium leading-none tracking-[-0.045em] text-white">
                  {displayCurrency} {formatDecimal(converted.annualCost, 2)}
                </strong>
              </article>
            </div>
            <dl className="m-0 grid divide-y divide-white/[0.07] px-5 py-2 sm:px-6">
              <div className="flex items-center justify-between gap-5 py-3.5 text-sm">
                <dt className="text-white/65">Model calls / month</dt>
                <dd className="m-0 font-mono font-semibold text-white/90">
                  {converted.modelRequests.toLocaleString('en-US')}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-5 py-3.5 text-sm">
                <dt className="text-white/65">Model inference cost</dt>
                <dd className="m-0 font-mono font-semibold text-white/90">
                  {displayCurrency} {formatDecimal(converted.modelCost, 2)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-5 py-3.5 text-sm">
                <dt className="inline-flex items-center gap-2 text-white/65">
                  <Wrench className="size-3.5" /> Other tool cost
                </dt>
                <dd className="m-0 font-mono font-semibold text-white/90">
                  {displayCurrency} {formatDecimal(converted.monthlyToolCost, 2)}
                </dd>
              </div>
            </dl>
          </>
        )}
      </section>
    </section>
  );
}
