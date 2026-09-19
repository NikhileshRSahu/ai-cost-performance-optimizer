'use client';

import {
  ArrowDownRight,
  ArrowUpRight,
  Calculator,
  RefreshCw,
} from 'lucide-react';
import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { providerPricingPresets } from '../../lib/provider-pricing';

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

export function WorkspaceModelCalculator({
  currentModel,
  workloadName,
}: Readonly<{
  currentModel: string | null;
  workloadName: string | null;
}>) {
  const matchedCurrent = providerPricingPresets.find(
    (preset) => preset.model.toLowerCase() === currentModel?.toLowerCase(),
  );
  const defaultCandidate =
    providerPricingPresets.find(
      (preset) =>
        matchedCurrent !== undefined &&
        preset.provider === matchedCurrent.provider &&
        preset.id !== matchedCurrent.id,
    ) ?? providerPricingPresets[0];

  const [requests, setRequests] = useState('100000');
  const [inputTokens, setInputTokens] = useState('1200');
  const [outputTokens, setOutputTokens] = useState('250');
  const [currentInputRate, setCurrentInputRate] = useState(
    matchedCurrent?.inputPerMillionUsd ?? '3',
  );
  const [currentOutputRate, setCurrentOutputRate] = useState(
    matchedCurrent?.outputPerMillionUsd ?? '15',
  );
  const [candidatePresetId, setCandidatePresetId] = useState(
    defaultCandidate.id,
  );
  const [candidateInputRate, setCandidateInputRate] = useState(
    defaultCandidate.inputPerMillionUsd,
  );
  const [candidateOutputRate, setCandidateOutputRate] = useState(
    defaultCandidate.outputPerMillionUsd,
  );

  const cheapestCandidate = useMemo(() => {
    return [...providerPricingPresets].sort((left, right) => {
      const leftCost =
        numberValue(left.inputPerMillionUsd) * numberValue(inputTokens) +
        numberValue(left.outputPerMillionUsd) * numberValue(outputTokens);
      const rightCost =
        numberValue(right.inputPerMillionUsd) * numberValue(inputTokens) +
        numberValue(right.outputPerMillionUsd) * numberValue(outputTokens);
      return leftCost - rightCost;
    })[0];
  }, [inputTokens, outputTokens]);

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
    setCurrentInputRate(matchedCurrent?.inputPerMillionUsd ?? '3');
    setCurrentOutputRate(matchedCurrent?.outputPerMillionUsd ?? '15');
    setCandidatePresetId(defaultCandidate.id);
    setCandidateInputRate(defaultCandidate.inputPerMillionUsd);
    setCandidateOutputRate(defaultCandidate.outputPerMillionUsd);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
      <section className="rounded-xl border border-white/[0.07] bg-[#111214] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300/70">
              Workload
            </p>
            <h2 className="m-0 mt-2 text-base font-medium text-slate-100">
              Compare the detected workload against a candidate
            </h2>
            <p className="m-0 mt-1 text-[11px] text-slate-500">
              {workloadName === null ? 'Workspace workload' : workloadName}
              {' · '}
              {currentModel === null
                ? 'current model not identified'
                : 'current: ' + currentModel}
            </p>
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
                onChange={(event) => {
                  (setter as Dispatch<SetStateAction<string>>)(
                    event.target.value,
                  );
                }}
                className="min-h-11 rounded-lg border border-white/[0.08] bg-[#0d0f12] px-3 font-mono text-sm text-slate-200 outline-none transition focus:border-sky-300/30"
              />
            </label>
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-white/[0.07] bg-[#0d0f12] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="m-0 text-sm font-medium text-slate-200">
                Current model{currentModel === null ? '' : ' · ' + currentModel}
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
                  onChange={(event) => {
                    setCurrentInputRate(event.target.value);
                  }}
                  className="min-h-11 rounded-lg border border-white/[0.08] bg-[#0f1115] px-3 font-mono text-sm text-slate-200 outline-none focus:border-sky-300/30"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-[10px] text-slate-500">Output</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={currentOutputRate}
                  onChange={(event) => {
                    setCurrentOutputRate(event.target.value);
                  }}
                  className="min-h-11 rounded-lg border border-white/[0.08] bg-[#0f1115] px-3 font-mono text-sm text-slate-200 outline-none focus:border-sky-300/30"
                />
              </label>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-400/12 bg-emerald-400/[0.025] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="m-0 text-sm font-medium text-slate-200">
                  Candidate model
                </p>
                <select
                  value={candidatePresetId}
                  onChange={(event) => {
                    const next = providerPricingPresets.find(
                      (preset) => preset.id === event.target.value,
                    );
                    setCandidatePresetId(event.target.value);
                    if (next !== undefined) {
                      setCandidateInputRate(next.inputPerMillionUsd);
                      setCandidateOutputRate(next.outputPerMillionUsd);
                    }
                  }}
                  className="mt-2 min-h-9 max-w-[220px] rounded-lg border border-white/[0.08] bg-[#0f1115] px-2 text-[10px] text-slate-300 outline-none"
                >
                  {providerPricingPresets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>
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
                  onChange={(event) => {
                    setCandidateInputRate(event.target.value);
                  }}
                  className="min-h-11 rounded-lg border border-white/[0.08] bg-[#0f1115] px-3 font-mono text-sm text-slate-200 outline-none focus:border-emerald-300/30"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-[10px] text-slate-500">Output</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={candidateOutputRate}
                  onChange={(event) => {
                    setCandidateOutputRate(event.target.value);
                  }}
                  className="min-h-11 rounded-lg border border-white/[0.08] bg-[#0f1115] px-3 font-mono text-sm text-slate-200 outline-none focus:border-emerald-300/30"
                />
              </label>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-white/[0.07] bg-[#111214] p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <Calculator className="size-4 text-amber-300" />
          <h2 className="m-0 text-base font-medium text-slate-100">
            What should you do?
          </h2>
        </div>

        <div
          className={
            result.delta > 0
              ? 'mt-5 rounded-xl border border-emerald-300/14 bg-emerald-300/[0.045] p-4'
              : result.delta < 0
                ? 'mt-5 rounded-xl border border-rose-300/14 bg-rose-300/[0.045] p-4'
                : 'mt-5 rounded-xl border border-white/[0.08] bg-white/[0.025] p-4'
          }
        >
          <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
            Evalomics recommendation
          </p>
          <p
            className={
              result.delta > 0
                ? 'm-0 mt-2 text-lg font-semibold text-emerald-200'
                : result.delta < 0
                  ? 'm-0 mt-2 text-lg font-semibold text-rose-200'
                  : 'm-0 mt-2 text-lg font-semibold text-white'
            }
          >
            {result.delta > 0
              ? 'Worth evaluating — this candidate could lower monthly cost.'
              : result.delta < 0
                ? 'Do not switch to this candidate — it costs more.'
                : 'No cost advantage — keep the current model for now.'}
          </p>
          <p className="m-0 mt-2 text-sm leading-6 text-white/45">
            {result.delta > 0
              ? 'Estimated saving: ' +
                money(result.delta) +
                ' per month (' +
                Math.abs(result.percent).toFixed(1) +
                '% lower). Quality still needs to pass before rollout.'
              : result.delta < 0
                ? 'This candidate adds about ' +
                  money(Math.abs(result.delta)) +
                  ' per month (' +
                  Math.abs(result.percent).toFixed(1) +
                  '% higher) at the same workload.'
                : 'The current and candidate scenarios are effectively equal on cost.'}
          </p>
        </div>

        <div className="mt-6 grid gap-3">
          <div className="rounded-xl border border-white/[0.06] bg-[#0d0f12] p-4">
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
                Estimated monthly difference
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

        <div className="mt-5 flex flex-wrap gap-2">
          {result.delta < 0 && cheapestCandidate !== undefined ? (
            <button
              type="button"
              onClick={() => {
                setCandidatePresetId(cheapestCandidate.id);
                setCandidateInputRate(cheapestCandidate.inputPerMillionUsd);
                setCandidateOutputRate(cheapestCandidate.outputPerMillionUsd);
              }}
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-white px-3 text-xs font-semibold text-slate-950"
            >
              Show lowest-cost alternative
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent('evalomics:ask', {
                  detail: {
                    context:
                      'Model evaluation for ' +
                      (workloadName ?? 'this workload') +
                      '. Current model: ' +
                      (currentModel ?? 'unknown') +
                      '. Current monthly cost: ' +
                      money(result.current) +
                      '. Candidate monthly cost: ' +
                      money(result.candidate) +
                      '. Difference: ' +
                      money(Math.abs(result.delta)) +
                      (result.delta >= 0 ? ' lower.' : ' higher.'),
                  },
                }),
              );
            }}
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-sky-300/15 bg-sky-300/[0.05] px-3 text-xs font-semibold text-sky-200"
          >
            Ask Evalomics why
          </button>
        </div>

        <p className="m-0 mt-4 text-[11px] leading-5 text-slate-500">
          This is the economics part of the evaluation. Evalomics still checks
          quality, latency, and failure-rate evidence before a cheaper candidate
          becomes a recommended production change.
        </p>
      </section>
    </div>
  );
}
