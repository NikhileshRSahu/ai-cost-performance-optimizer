'use client';

import { CircleDollarSign, Gauge, Target } from 'lucide-react';
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

export function CostPerOutcomeCalculator() {
  const [monthlyCost, setMonthlyCost] = useState('1000');
  const [requests, setRequests] = useState('10000');
  const [successRate, setSuccessRate] = useState('80');
  const [inputCurrency, setInputCurrency] = useState('USD');
  const [displayCurrency, setDisplayCurrency] = useState('USD');
  const fx = useFxRate(inputCurrency, displayCurrency);

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

  const fxRate = useMemo(() => {
    if (fx.status !== 'ready' && fx.status !== 'identity') return null;
    return parseNonNegative(fx.rate);
  }, [fx]);

  const converted = useMemo(() => {
    if (result === null || fxRate === null) return null;
    return {
      successful: result.successful,
      costPerRequest: multiply(result.costPerRequest, fxRate),
      costPerSuccess: multiply(result.costPerSuccess, fxRate),
      impliedUnsuccessfulSpend: multiply(
        result.impliedUnsuccessfulSpend,
        fxRate,
      ),
    };
  }, [result, fxRate]);

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
              Outcome economics
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-[-0.025em] text-slate-950">
              Price reliability, not just requests
            </h2>
          </div>
          <div className="grid size-10 place-items-center rounded-xl bg-slate-950 text-white">
            <Target className="size-4" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-slate-800">
            <span>Monthly AI cost</span>
            <input
              className={fieldClass}
              inputMode="decimal"
              value={monthlyCost}
              onChange={(event) => {
                setMonthlyCost(event.target.value);
              }}
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-800">
            <span>Requests per month</span>
            <input
              className={fieldClass}
              inputMode="numeric"
              value={requests}
              onChange={(event) => {
                setRequests(event.target.value);
              }}
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-800">
            <span>Successful outcome rate (%)</span>
            <input
              className={fieldClass}
              inputMode="decimal"
              value={successRate}
              onChange={(event) => {
                setSuccessRate(event.target.value);
              }}
            />
            <small className="text-xs font-normal text-slate-500">
              Must be above 0 and at most 100.
            </small>
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-800">
            <span>Currency of monthly cost</span>
            <select
              className={fieldClass}
              value={inputCurrency}
              onChange={(event) => {
                setInputCurrency(event.target.value);
              }}
            >
              {currencies.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-800 sm:col-span-2">
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
            <small className="text-xs font-normal leading-5 text-slate-500">
              {inputCurrency === displayCurrency
                ? 'No FX conversion is needed.'
                : fx.status === 'ready'
                  ? `1 ${inputCurrency} = ${fx.rate} ${displayCurrency} · ${fx.source} · ${fx.asOf}`
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
            Outcome economics
          </p>
          <p className="m-0 mt-1 text-sm text-white/70">
            Measured success rate changes the real cost of value delivered
          </p>
        </div>

        {result === null ? (
          <div className="p-6 text-sm leading-6 text-white/75">
            Enter a positive request count and a successful outcome rate above
            0% and at most 100%.
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
              {[
                [
                  'Cost per successful outcome',
                  `${displayCurrency} ${formatDecimal(converted.costPerSuccess, 4)}`,
                  CircleDollarSign,
                ],
                [
                  'Cost per request',
                  `${displayCurrency} ${formatDecimal(converted.costPerRequest, 4)}`,
                  Gauge,
                ],
                [
                  'Successful outcomes',
                  formatDecimal(converted.successful, 2),
                  Target,
                ],
              ].map(([label, value, Icon]) => {
                const MetricIcon = Icon as typeof Target;
                return (
                  <article
                    key={label as string}
                    className="min-w-0 bg-[#071019] p-5"
                  >
                    <MetricIcon className="size-4 text-emerald-200/75" />
                    <p className="m-0 mt-6 text-[9px] font-semibold uppercase tracking-[0.13em] text-white/65">
                      {label as string}
                    </p>
                    <strong className="mt-2 block break-words font-mono text-[clamp(1.45rem,2.1vw,2rem)] font-medium leading-none tracking-[-0.045em] text-white">
                      {value as string}
                    </strong>
                  </article>
                );
              })}
            </div>
            <dl className="m-0 grid px-5 py-2 sm:px-6">
              <div className="flex items-center justify-between gap-5 py-3.5 text-sm">
                <dt className="text-white/65">
                  Implied spend on unsuccessful requests
                </dt>
                <dd className="m-0 font-mono font-semibold text-white/90">
                  {displayCurrency}{' '}
                  {formatDecimal(converted.impliedUnsuccessfulSpend, 2)}
                </dd>
              </div>
            </dl>
          </>
        )}
      </section>
    </section>
  );
}
