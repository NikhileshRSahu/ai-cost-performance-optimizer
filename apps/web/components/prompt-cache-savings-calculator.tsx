'use client';

import { Layers, TrendingDown, TrendingUp } from 'lucide-react';
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
import { useFxRate } from '../hooks/use-fx-rate';

const currencies = ['USD', 'EUR', 'GBP', 'INR'] as const;
const fieldClass =
  'min-h-12 w-full rounded-xl border border-white/[0.08] bg-[#091018] px-3.5 text-sm font-semibold text-white/82 outline-none transition focus:border-cyan-300/30 focus:ring-4 focus:ring-cyan-300/[0.06]';

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

function absolute(value: Rational): Rational {
  return value.numerator < 0n
    ? rational(-value.numerator, value.denominator)
    : value;
}

export function PromptCacheSavingsCalculator() {
  const [requests, setRequests] = useState('10000');
  const [cacheableTokens, setCacheableTokens] = useState('1000');
  const [uncachedRate, setUncachedRate] = useState('1');
  const [cachedRate, setCachedRate] = useState('0.1');
  const [hitRate, setHitRate] = useState('80');
  const [rateCurrency, setRateCurrency] = useState('USD');
  const [displayCurrency, setDisplayCurrency] = useState('USD');
  const fx = useFxRate(rateCurrency, displayCurrency);

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
      beneficial: savings.numerator >= 0n,
    };
  }, [requests, cacheableTokens, uncachedRate, cachedRate, hitRate]);

  const fxRate = useMemo(() => {
    if (fx.status !== 'ready' && fx.status !== 'identity') return null;
    return parseNonNegative(fx.rate);
  }, [fx]);

  const converted = useMemo(() => {
    if (result === null || fxRate === null) return null;
    return {
      ...result,
      baseline: multiply(result.baseline, fxRate),
      cachedCost: multiply(result.cachedCost, fxRate),
      savings: multiply(result.savings, fxRate),
      annualSavings: multiply(result.annualSavings, fxRate),
    };
  }, [result, fxRate]);

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
              Prompt cache economics
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-[-0.025em] text-white">
              Test whether caching actually saves money
            </h2>
          </div>
          <div className="grid size-10 place-items-center rounded-xl bg-white/[0.05] text-cyan-300">
            <Layers className="size-4" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-white/72">
            <span>Requests per month</span>
            <input
              className={fieldClass}
              inputMode="numeric"
              value={requests}
              onChange={(e) => {
                setRequests(e.target.value);
              }}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-white/72">
            <span>Cacheable input tokens / request</span>
            <input
              className={fieldClass}
              inputMode="numeric"
              value={cacheableTokens}
              onChange={(e) => {
                setCacheableTokens(e.target.value);
              }}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-white/72">
            <span>Uncached input price / 1M tokens</span>
            <input
              className={fieldClass}
              inputMode="decimal"
              value={uncachedRate}
              onChange={(e) => {
                setUncachedRate(e.target.value);
              }}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-white/72">
            <span>Cached input price / 1M tokens</span>
            <input
              className={fieldClass}
              inputMode="decimal"
              value={cachedRate}
              onChange={(e) => {
                setCachedRate(e.target.value);
              }}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-white/72">
            <span>Cache hit rate (%)</span>
            <input
              className={fieldClass}
              inputMode="decimal"
              value={hitRate}
              onChange={(e) => {
                setHitRate(e.target.value);
              }}
            />
            <small className="text-xs font-normal text-white/34">
              Must be between 0 and 100.
            </small>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-white/72">
            <span>Currency of entered rates</span>
            <select
              className={fieldClass}
              value={rateCurrency}
              onChange={(e) => {
                setRateCurrency(e.target.value);
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
              onChange={(e) => {
                setDisplayCurrency(e.target.value);
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
            Cache impact
          </p>
          <p className="m-0 mt-1 text-sm text-white/70">
            A negative saving is shown as a cost premium, never disguised
          </p>
        </div>

        {result === null ? (
          <div className="p-6 text-sm leading-6 text-white/75">
            Enter non-negative prices and a cache hit rate from 0 through 100.
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
                {converted.beneficial ? (
                  <TrendingDown className="size-4 text-emerald-200/75" />
                ) : (
                  <TrendingUp className="size-4 text-amber-200/80" />
                )}
                <p className="m-0 mt-6 text-[9px] font-semibold uppercase tracking-[0.13em] text-white/65">
                  {converted.beneficial
                    ? 'Potential monthly cache saving'
                    : 'Estimated monthly cache premium'}
                </p>
                <strong className="mt-2 block font-mono text-[clamp(1.45rem,2.1vw,2rem)] font-medium leading-none tracking-[-0.045em] text-white">
                  {displayCurrency}{' '}
                  {formatDecimal(absolute(converted.savings), 2)}
                </strong>
              </article>
              <article className="min-w-0 bg-[#071019] p-5">
                <Layers className="size-4 text-emerald-200/75" />
                <p className="m-0 mt-6 text-[9px] font-semibold uppercase tracking-[0.13em] text-white/65">
                  Baseline cacheable-input cost
                </p>
                <strong className="mt-2 block font-mono text-[clamp(1.45rem,2.1vw,2rem)] font-medium leading-none tracking-[-0.045em] text-white">
                  {displayCurrency} {formatDecimal(converted.baseline, 2)}
                </strong>
              </article>
              <article className="min-w-0 bg-[#071019] p-5">
                <Layers className="size-4 text-emerald-200/75" />
                <p className="m-0 mt-6 text-[9px] font-semibold uppercase tracking-[0.13em] text-white/65">
                  Estimated blended cost
                </p>
                <strong className="mt-2 block font-mono text-[clamp(1.45rem,2.1vw,2rem)] font-medium leading-none tracking-[-0.045em] text-white">
                  {displayCurrency} {formatDecimal(converted.cachedCost, 2)}
                </strong>
              </article>
            </div>
            <dl className="m-0 grid divide-y divide-white/[0.07] px-5 py-2 sm:px-6">
              <div className="flex items-center justify-between gap-5 py-3.5 text-sm">
                <dt className="text-white/65">
                  {converted.beneficial
                    ? 'Annualized potential saving'
                    : 'Annualized estimated premium'}
                </dt>
                <dd className="m-0 font-mono font-semibold text-white/90">
                  {displayCurrency}{' '}
                  {formatDecimal(absolute(converted.annualSavings), 2)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-5 py-3.5 text-sm">
                <dt className="text-white/65">
                  Cacheable input tokens / month
                </dt>
                <dd className="m-0 font-mono font-semibold text-white/90">
                  {converted.totalTokens.toLocaleString('en-US')}
                </dd>
              </div>
            </dl>
          </>
        )}
      </section>
    </section>
  );
}
