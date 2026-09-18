'use client';

import { ArrowDownRight, ArrowUpRight, Calculator, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';

function numberValue(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function money(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

export function WorkspaceModelCalculator() {
  const [requests, setRequests] = useState('100000');
  const [inputTokens, setInputTokens] = useState('1200');
  const [outputTokens, setOutputTokens] = useState('250');
  const [currentInputRate, setCurrentInputRate] = useState('3');
  const [currentOutputRate, setCurrentOutputRate] = useState('15');
  const [candidateInputRate, setCandidateInputRate] = useState('1.5');
  const [candidateOutputRate, setCandidateOutputRate] = useState('8');

  const result = useMemo(() => {
    const requestCount = numberValue(requests);
    const input = numberValue(inputTokens);
    const output = numberValue(outputTokens);

    const current =
      (requestCount * input * numberValue(currentInputRate)) / 1_000_000 +
      (requestCount * output * numberValue(currentOutputRate)) / 1_000_000;

    const candidate =
      (requestCount * input * numberValue(candidateInputRate)) / 1_000_000 +
      (requestCount * output * numberValue(candidateOutputRate)) / 1_000_000;

    const delta = current - candidate;
    const percent = current > 0 ? (delta / current) * 100 : 0;

    return { current, candidate, delta, percent };
  }, [
    requests,
    inputTokens,
    outputTokens,
    currentInputRate,
    currentOutputRate,
    candidateInputRate,
    candidateOutputRate,
  ]);

  function reset() {
    setRequests('100000');
    setInputTokens('1200');
    setOutputTokens('250');
    setCurrentInputRate('3');
    setCurrentOutputRate('15');
    setCandidateInputRate('1.5');
    setCandidateOutputRate('8');
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
      <section className="rounded-xl border border-white/[0.07] bg-[#111a29] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300/70">
              Workload
            </p>
            <h2 className="m-0 mt-2 text-base font-medium text-slate-100">
              Compare two model-price scenarios
            </h2>
          </div>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-[11px] font-semibold text-slate-400 transition hover:text-white"
          >
            <RefreshCw className="size-3.5" />
            Reset
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            ['Monthly requests', requests, setRequests],
            ['Input tokens / request', inputTokens, setInputTokens],
            ['Output tokens / request', outputTokens, setOutputTokens],
          ].map(([label, value, setter]) => (
            <label key={String(label)} className="grid gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                {String(label)}
              </span>
              <input
                type="number"
                min="0"
                step="1"
                value={String(value)}
                onChange={(event) =>
                  (setter as React.Dispatch<React.SetStateAction<string>>)(
                    event.target.value,
                  )
                }
                className="min-h-11 rounded-lg border border-white/[0.08] bg-[#0c1421] px-3 font-mono text-sm text-slate-200 outline-none transition focus:border-sky-300/30"
              />
            </label>
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-white/[0.07] bg-[#0c1421] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="m-0 text-sm font-medium text-slate-200">
                Current model
              </p>
              <span className="rounded-full bg-white/[0.04] px-2 py-1 text-[9px] font-semibold text-slate-500">
                USD / 1M tokens
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="grid gap-2">
                <span className="text-[10px] text-slate-500">Input</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={currentInputRate}
                  onChange={(event) => setCurrentInputRate(event.target.value)}
                  className="min-h-11 rounded-lg border border-white/[0.08] bg-[#101a2a] px-3 font-mono text-sm text-slate-200 outline-none focus:border-sky-300/30"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-[10px] text-slate-500">Output</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={currentOutputRate}
                  onChange={(event) => setCurrentOutputRate(event.target.value)}
                  className="min-h-11 rounded-lg border border-white/[0.08] bg-[#101a2a] px-3 font-mono text-sm text-slate-200 outline-none focus:border-sky-300/30"
                />
              </label>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-400/12 bg-emerald-400/[0.025] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="m-0 text-sm font-medium text-slate-200">
                Candidate model
              </p>
              <span className="rounded-full bg-emerald-400/[0.08] px-2 py-1 text-[9px] font-semibold text-emerald-300/70">
                USD / 1M tokens
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="grid gap-2">
                <span className="text-[10px] text-slate-500">Input</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={candidateInputRate}
                  onChange={(event) => setCandidateInputRate(event.target.value)}
                  className="min-h-11 rounded-lg border border-white/[0.08] bg-[#101a2a] px-3 font-mono text-sm text-slate-200 outline-none focus:border-emerald-300/30"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-[10px] text-slate-500">Output</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={candidateOutputRate}
                  onChange={(event) => setCandidateOutputRate(event.target.value)}
                  className="min-h-11 rounded-lg border border-white/[0.08] bg-[#101a2a] px-3 font-mono text-sm text-slate-200 outline-none focus:border-emerald-300/30"
                />
              </label>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-white/[0.07] bg-[#111a29] p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <Calculator className="size-4 text-amber-300" />
          <h2 className="m-0 text-base font-medium text-slate-100">
            Scenario result
          </h2>
        </div>

        <div className="mt-6 grid gap-3">
          <div className="rounded-xl border border-white/[0.06] bg-[#0c1421] p-4">
            <p className="m-0 text-[10px] uppercase tracking-[0.14em] text-slate-600">
              Current monthly inference cost
            </p>
            <p className="m-0 mt-3 font-mono text-2xl text-slate-100">
              {money(result.current)}
            </p>
          </div>

          <div className="rounded-xl border border-sky-300/10 bg-sky-400/[0.025] p-4">
            <p className="m-0 text-[10px] uppercase tracking-[0.14em] text-slate-600">
              Candidate monthly inference cost
            </p>
            <p className="m-0 mt-3 font-mono text-2xl text-sky-300">
              {money(result.candidate)}
            </p>
          </div>

          <div
            className={
              result.delta >= 0
                ? 'rounded-xl border border-emerald-400/14 bg-emerald-400/[0.04] p-4'
                : 'rounded-xl border border-rose-400/14 bg-rose-400/[0.04] p-4'
            }
          >
            <div className="flex items-center justify-between gap-3">
              <p className="m-0 text-[10px] uppercase tracking-[0.14em] text-slate-500">
                Modeled monthly delta
              </p>
              {result.delta >= 0 ? (
                <ArrowDownRight className="size-4 text-emerald-300" />
              ) : (
                <ArrowUpRight className="size-4 text-rose-300" />
              )}
            </div>
            <p
              className={
                result.delta >= 0
                  ? 'm-0 mt-3 font-mono text-3xl text-emerald-300'
                  : 'm-0 mt-3 font-mono text-3xl text-rose-300'
              }
            >
              {money(Math.abs(result.delta))}
            </p>
            <p className="m-0 mt-2 text-xs text-slate-500">
              {result.delta >= 0 ? 'lower' : 'higher'} by{' '}
              {Math.abs(result.percent).toFixed(1)}%
            </p>
          </div>
        </div>

        <p className="m-0 mt-5 text-[11px] leading-5 text-slate-500">
          Planning estimate only. This compares the token rates and workload
          values you entered; it does not prove equivalent quality, latency, or
          production savings.
        </p>
      </section>
    </div>
  );
}
