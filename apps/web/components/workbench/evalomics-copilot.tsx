'use client';

import Link from 'next/link';
import { Bot, Send, Sparkles, X } from 'lucide-react';
import { useState, type SyntheticEvent } from 'react';

type AiAnswer = Readonly<{
  answer: string;
  facts: readonly string[];
  action: Readonly<{ label: string; href: string }> | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}>;

const quickQuestions = [
  'What should I optimize first?',
  'Why is my AI spend high?',
  'How much could I save?',
  'How do I implement the recommendation?',
  'What evidence supports this?',
] as const;

export function EvalomicsCopilot({
  organizationId,
}: Readonly<{ organizationId: string }>) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<AiAnswer | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(nextQuestion: string) {
    const trimmed = nextQuestion.trim();
    if (trimmed.length === 0 || pending) return;

    setPending(true);
    setError(null);
    try {
      const response = await fetch('/api/evalomics-ai', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ organizationId, question: trimmed }),
      });

      if (!response.ok) {
        throw new Error('EVALOMICS_AI_REQUEST_FAILED');
      }

      setAnswer((await response.json()) as AiAnswer);
      setQuestion('');
    } catch {
      setError(
        'Evalomics AI could not answer this right now. Your workspace data was not changed.',
      );
    } finally {
      setPending(false);
    }
  }

  function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(question);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
        className="fixed bottom-5 right-5 z-[70] inline-flex min-h-12 items-center gap-2 rounded-full border border-sky-300/20 bg-[#111827]/95 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_70px_rgba(0,0,0,.45)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-sky-300/35"
        aria-label="Open Evalomics AI"
      >
        <span className="grid size-7 place-items-center rounded-full bg-sky-400 text-[#07101b]">
          <Sparkles className="size-3.5" />
        </span>
        Evalomics AI
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[90] bg-black/55 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <aside className="absolute bottom-0 right-0 flex h-[min(88vh,760px)] w-full max-w-[460px] flex-col border-l border-t border-white/[0.09] bg-[#0d1118] shadow-[-20px_-10px_90px_rgba(0,0,0,.45)] sm:bottom-5 sm:right-5 sm:rounded-[28px] sm:border">
            <header className="flex items-start justify-between gap-4 border-b border-white/[0.07] p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-10 place-items-center rounded-2xl border border-sky-300/15 bg-sky-300/[0.06]">
                  <Bot className="size-5 text-sky-200" />
                </span>
                <div>
                  <p className="m-0 text-sm font-semibold text-white">
                    Evalomics AI
                  </p>
                  <p className="m-0 mt-1 text-[11px] leading-5 text-white/38">
                    Evidence-grounded optimization copilot
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                }}
                className="grid size-9 place-items-center rounded-full border border-white/[0.08] bg-white/[0.03] text-white/45 hover:text-white"
                aria-label="Close Evalomics AI"
              >
                <X className="size-4" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-5">
              {answer === null ? (
                <div className="grid gap-5">
                  <div className="rounded-2xl border border-emerald-300/10 bg-emerald-300/[0.035] p-4">
                    <p className="m-0 text-sm leading-6 text-emerald-50/75">
                      Ask about your spend, the strongest optimization, expected
                      savings, evidence, or implementation. Financial claims
                      come from Evalomics' deterministic evidence engine — not
                      generated guesses.
                    </p>
                  </div>
                  <div className="grid gap-2">
                    {quickQuestions.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          void ask(item);
                        }}
                        className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3 text-left text-sm text-white/65 transition hover:border-sky-300/20 hover:text-white"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid gap-5">
                  <div className="rounded-2xl border border-sky-300/10 bg-sky-300/[0.035] p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-sky-200/65">
                        Evalomics answer
                      </span>
                      <span className="rounded-full border border-white/[0.08] bg-black/20 px-2 py-1 font-mono text-[9px] text-white/38">
                        {answer.confidence} confidence
                      </span>
                    </div>
                    <p className="m-0 text-sm leading-7 text-white/75">
                      {answer.answer}
                    </p>
                  </div>

                  {answer.facts.length > 0 ? (
                    <div>
                      <p className="m-0 mb-2 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-white/30">
                        Evidence used
                      </p>
                      <div className="grid gap-2">
                        {answer.facts.map((fact) => (
                          <div
                            key={fact}
                            className="rounded-xl border border-white/[0.07] bg-black/20 px-3 py-2.5 text-xs leading-5 text-white/52"
                          >
                            {fact}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {answer.action !== null ? (
                    <Link
                      href={answer.action.href}
                      onClick={() => setOpen(false)}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 no-underline"
                    >
                      {answer.action.label}
                    </Link>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => {
                      setAnswer(null);
                    }}
                    className="text-left text-xs font-semibold text-sky-300/70"
                  >
                    Ask another question
                  </button>
                </div>
              )}

              {error !== null ? (
                <div className="mt-4 rounded-xl border border-rose-300/15 bg-rose-300/[0.05] p-3 text-xs leading-5 text-rose-100/75">
                  {error}
                </div>
              ) : null}
            </div>

            <form
              onSubmit={handleSubmit}
              className="border-t border-white/[0.07] p-4"
            >
              <div className="flex items-end gap-2 rounded-2xl border border-white/[0.09] bg-black/20 p-2">
                <textarea
                  value={question}
                  onChange={(event) => {
                    setQuestion(event.target.value);
                  }}
                  rows={2}
                  maxLength={1000}
                  placeholder="Ask Evalomics about this workspace…"
                  className="min-h-12 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-6 text-white outline-none placeholder:text-white/24"
                />
                <button
                  type="submit"
                  disabled={pending || question.trim().length === 0}
                  className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-400 text-[#07101b] disabled:opacity-35"
                  aria-label="Ask Evalomics"
                >
                  <Send className="size-4" />
                </button>
              </div>
              <p className="m-0 mt-2 px-1 text-[10px] leading-4 text-white/25">
                Evalomics AI explains evidence; deterministic engines remain
                authoritative for cost and proof.
              </p>
            </form>
          </aside>
        </div>
      ) : null}
    </>
  );
}
