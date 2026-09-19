'use client';

import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  CircleDot,
  Database,
  FileSearch,
  FlaskConical,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const labels = [
  'Reading 22,380 requests',
  'Normalizing cost + token evidence',
  'Rejecting unsupported guesses',
  'Ranking the strongest action',
] as const;

export function PublicDemoExperience() {
  const reduceMotion = useReducedMotion();
  const [stage, setStage] = useState(reduceMotion ? 4 : 0);
  const done = stage >= 4;

  useEffect(() => {
    if (reduceMotion || done) return;
    const t = window.setTimeout(() => setStage((s) => Math.min(s + 1, 4)), 900);
    return () => window.clearTimeout(t);
  }, [done, reduceMotion, stage]);

  return (
    <section className="overflow-hidden rounded-[30px] border border-slate-800 bg-[#070a0f] text-white shadow-[0_35px_120px_rgba(2,6,23,.2)]">
      <div className="flex flex-col gap-4 border-b border-white/[0.08] px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div>
          <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200/70">
            Public synthetic demo
          </p>
          <h1 className="m-0 mt-2 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
            Watch Evalomics turn usage into one decision.
          </h1>
        </div>
        <span className="w-fit rounded-full border border-amber-300/18 bg-amber-300/[0.07] px-3 py-1.5 text-[10px] font-semibold text-amber-100">
          No login · not a customer result
        </span>
      </div>
      <div className="grid lg:grid-cols-[.72fr_1.28fr]">
        <aside className="border-b border-white/[0.07] p-6 lg:border-b-0 lg:border-r lg:p-8">
          <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/35">
            Synthetic evidence
          </p>
          <div className="mt-5 grid gap-3">
            {[
              ['Requests', '22,380'],
              ['Input tokens', '18.1M'],
              ['Output tokens', '2.4M'],
              ['Observed spend', 'USD 1,774.78'],
            ].map(([label, value], index) => (
              <motion.div
                key={label}
                animate={
                  reduceMotion
                    ? undefined
                    : {
                        opacity: stage > index / 2 ? 1 : 0.32,
                        y: stage > index / 2 ? 0 : 4,
                      }
                }
                className="flex items-center justify-between rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3.5"
              >
                <span className="text-xs text-white/45">{label}</span>
                <span className="font-mono text-sm font-semibold text-white/88">
                  {value}
                </span>
              </motion.div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setStage(reduceMotion ? 4 : 0)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-white/60 hover:bg-white/[0.07] hover:text-white"
          >
            <RotateCcw className="size-3.5" /> Run again
          </button>
        </aside>
        <div className="relative min-h-[520px] p-6 sm:p-8">
          <div className="grid gap-2.5">
            {labels.map((label, index) => {
              const active = stage === index,
                complete = stage > index;
              return (
                <motion.div
                  key={label}
                  animate={
                    reduceMotion
                      ? undefined
                      : { opacity: stage >= index ? 1 : 0.3 }
                  }
                  className={
                    active
                      ? 'flex items-center gap-3 rounded-xl border border-blue-300/18 bg-blue-300/[0.055] px-4 py-3'
                      : 'flex items-center gap-3 rounded-xl border border-white/[0.055] bg-white/[0.015] px-4 py-3'
                  }
                >
                  {complete ? (
                    <CheckCircle2 className="size-4 text-emerald-300" />
                  ) : active ? (
                    <Sparkles className="size-4 text-blue-200" />
                  ) : (
                    <CircleDot className="size-4 text-white/25" />
                  )}
                  <span
                    className={
                      active
                        ? 'text-sm font-semibold text-white/88'
                        : 'text-sm text-white/45'
                    }
                  >
                    {label}
                  </span>
                </motion.div>
              );
            })}
          </div>
          <AnimatePresence mode="wait">
            {done ? (
              <motion.div
                id="recommendation"
                key="result"
                initial={
                  reduceMotion ? false : { opacity: 0, y: 16, scale: 0.985 }
                }
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="mt-6 overflow-hidden rounded-[24px] border border-emerald-300/18 bg-[linear-gradient(145deg,rgba(110,231,183,.07),rgba(255,255,255,.018))]"
              >
                <div className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-amber-300/20 bg-amber-300/[0.07] px-3 py-1 text-[10px] font-semibold text-amber-100">
                        Opportunity
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">
                        strongest supported action
                      </span>
                    </div>
                    <span className="font-mono text-xs text-white/45">
                      confidence · low
                    </span>
                  </div>
                  <h2 className="mt-5 max-w-[18ch] text-[clamp(2rem,4vw,3.4rem)] font-semibold leading-[.96] tracking-[-0.05em] text-white">
                    Test higher cache reuse on explicitly eligible input.
                  </h2>
                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    {[
                      ['Spend analyzed', 'USD 1,774.78', Database],
                      ['Savings', 'Not measured yet', FileSearch],
                      ['Next step', 'Benchmark', FlaskConical],
                    ].map(([label, value, Icon]) => {
                      const MetricIcon = Icon as typeof Database;
                      return (
                        <div
                          key={String(label)}
                          className="rounded-2xl border border-white/[0.07] bg-black/20 p-4"
                        >
                          <MetricIcon className="size-4 text-emerald-200/70" />
                          <p className="m-0 mt-4 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/32">
                            {String(label)}
                          </p>
                          <p className="m-0 mt-1.5 text-sm font-semibold text-white/86">
                            {String(value)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex flex-col gap-3 border-t border-white/[0.07] bg-black/15 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <p className="m-0 text-xs text-white/42">
                    Evalomics found an action. It still refuses to invent the
                    savings.
                  </p>
                  <Link
                    href="/start"
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-slate-950 no-underline"
                  >
                    Analyze your usage <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="working"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 grid min-h-56 place-items-center rounded-[24px] border border-dashed border-white/[0.08] bg-white/[0.012]"
              >
                <div className="text-center">
                  <motion.span
                    animate={reduceMotion ? undefined : { rotate: 360 }}
                    transition={{
                      duration: 2.4,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    className="mx-auto grid size-12 place-items-center rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.055]"
                  >
                    <Sparkles className="size-5 text-emerald-200" />
                  </motion.span>
                  <p className="m-0 mt-4 text-sm font-semibold text-white/75">
                    Evalomics is narrowing the decision…
                  </p>
                  <p className="m-0 mt-1 text-xs text-white/32">
                    No fake percentage. Only real stages.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
