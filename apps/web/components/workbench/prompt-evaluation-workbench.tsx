'use client';

import { Sparkles, WandSparkles } from 'lucide-react';
import { useMemo, useState } from 'react';

function approxTokens(value: string): number {
  return Math.max(0, Math.ceil(value.trim().length / 4));
}

function optimizedDraft(value: string): string {
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const seen = new Set<string>();
  const deduped = lines.filter((line) => {
    const key = line.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return deduped
    .join('\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function findings(value: string): readonly string[] {
  const result: string[] = [];
  const lines = value.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const unique = new Set(lines.map((line) => line.trim().toLowerCase()));

  if (lines.length > unique.size) {
    result.push('Repeated instruction lines detected.');
  }
  if (value.length > 6000) {
    result.push('Large prompt context detected; retrieval or context pruning may help.');
  }
  if (/always|must|never/gi.test(value) && value.length > 1500) {
    result.push('Constraint language is spread across a long prompt; consolidating rules may reduce repetition.');
  }
  if (!/json|schema|format|output/i.test(value) && value.length > 1200) {
    result.push('Output contract is not explicit; a compact schema may reduce repeated formatting instructions.');
  }
  if (result.length === 0) {
    result.push('No obvious structural waste found by the deterministic prompt checks.');
  }
  return Object.freeze(result);
}

export function PromptEvaluationWorkbench() {
  const [prompt, setPrompt] = useState('');
  const [candidate, setCandidate] = useState('');
  const [analyzed, setAnalyzed] = useState(false);

  const originalTokens = useMemo(() => approxTokens(prompt), [prompt]);
  const candidateTokens = useMemo(() => approxTokens(candidate), [candidate]);
  const reduction =
    originalTokens > 0
      ? Math.max(0, ((originalTokens - candidateTokens) / originalTokens) * 100)
      : 0;
  const detected = useMemo(() => findings(prompt), [prompt]);

  function analyze() {
    const draft = optimizedDraft(prompt);
    setCandidate(draft);
    setAnalyzed(true);
  }

  return (
    <section className="rounded-[22px] border border-violet-300/12 bg-[#10131b] p-5 sm:p-6">
      <div className="flex flex-col gap-3 border-b border-white/[0.07] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="m-0 font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-violet-200/65">
            Prompt evaluation workflow
          </p>
          <h2 className="m-0 mt-2 text-xl font-semibold text-white">
            Paste a prompt. Evalomics finds structural waste and drafts a leaner candidate.
          </h2>
          <p className="m-0 mt-2 max-w-3xl text-sm leading-6 text-white/45">
            This first pass is deterministic: token estimates and structural findings are calculated locally.
            The candidate is a draft until it is compared against representative quality evidence.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">
            Current prompt
          </span>
          <textarea
            value={prompt}
            onChange={(event) => {
              setPrompt(event.target.value);
              setAnalyzed(false);
            }}
            rows={14}
            placeholder="Paste the prompt or stable context you want Evalomics to inspect…"
            className="min-h-[300px] resize-y rounded-xl border border-white/[0.08] bg-black/20 p-4 font-mono text-xs leading-6 text-white/75 outline-none focus:border-violet-300/30"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">
            Evalomics candidate
          </span>
          <textarea
            value={candidate}
            onChange={(event) => {
              setCandidate(event.target.value);
            }}
            rows={14}
            placeholder="Run analysis to generate a candidate draft."
            className="min-h-[300px] resize-y rounded-xl border border-emerald-300/10 bg-emerald-300/[0.025] p-4 font-mono text-xs leading-6 text-white/75 outline-none focus:border-emerald-300/30"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={prompt.trim().length === 0}
          onClick={analyze}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-35"
        >
          <WandSparkles className="size-4" />
          Analyze and draft candidate
        </button>
        {analyzed ? (
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent('evalomics:ask', {
                  detail: {
                    context:
                      'Prompt evaluation. Original estimated tokens: ' +
                      String(originalTokens) +
                      '. Candidate estimated tokens: ' +
                      String(candidateTokens) +
                      '. Estimated structural reduction: ' +
                      reduction.toFixed(1) +
                      '%. Findings: ' +
                      detected.join(' '),
                  },
                }),
              );
            }}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-sky-300/15 bg-sky-300/[0.05] px-4 py-2 text-sm font-semibold text-sky-200"
          >
            <Sparkles className="size-4" />
            Ask Evalomics about this candidate
          </button>
        ) : null}
      </div>

      {analyzed ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
              <p className="m-0 text-[9px] uppercase tracking-[0.13em] text-white/30">
                Original tokens
              </p>
              <p className="m-0 mt-2 font-mono text-xl text-white">{originalTokens}</p>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
              <p className="m-0 text-[9px] uppercase tracking-[0.13em] text-white/30">
                Candidate tokens
              </p>
              <p className="m-0 mt-2 font-mono text-xl text-white">{candidateTokens}</p>
            </div>
            <div className="rounded-xl border border-emerald-300/12 bg-emerald-300/[0.035] p-4">
              <p className="m-0 text-[9px] uppercase tracking-[0.13em] text-emerald-200/55">
                Structural reduction
              </p>
              <p className="m-0 mt-2 font-mono text-xl text-emerald-200">
                {reduction.toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
            <p className="m-0 text-[9px] font-semibold uppercase tracking-[0.13em] text-white/30">
              What Evalomics detected
            </p>
            <ul className="mt-3 grid gap-2 pl-5 text-sm leading-6 text-white/55">
              {detected.map((finding) => (
                <li key={finding}>{finding}</li>
              ))}
            </ul>
            <div className="mt-4 rounded-lg border border-amber-300/10 bg-amber-300/[0.035] p-3 text-xs leading-5 text-amber-50/55">
              Token reduction alone is not a quality result. Use representative cases before adopting the candidate.
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
