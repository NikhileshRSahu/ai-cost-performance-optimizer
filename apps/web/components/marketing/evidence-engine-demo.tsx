'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowDown,
  CheckCircle2,
  CircleDot,
  Database,
  FileText,
  FlaskConical,
  ShieldCheck,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const stages = [
  'Reading usage evidence',
  'Ranking supported opportunities',
  'Strongest supported answer',
  'Proof state stays honest',
] as const;

const sourceItems = [
  { label: 'OpenAI', detail: 'Admin usage + cost evidence', icon: Database },
  { label: 'Anthropic', detail: 'Admin usage + cost evidence', icon: Database },
  { label: 'CSV', detail: 'Usage export fallback', icon: FileText },
] as const;

const proofStates = [
  {
    label: 'Opportunity',
    detail: 'Detected from usage',
    icon: CircleDot,
    classes: 'border-amber-300/20 bg-amber-300/[0.055] text-amber-100',
  },
  {
    label: 'Tested',
    detail: 'Benchmark-supported',
    icon: FlaskConical,
    classes: 'border-blue-300/20 bg-blue-300/[0.055] text-blue-100',
  },
  {
    label: 'Verified',
    detail: 'Production evidence',
    icon: ShieldCheck,
    classes: 'border-emerald-300/20 bg-emerald-300/[0.055] text-emerald-100',
  },
] as const;

export function EvidenceEngineDemo() {
  const reduceMotion = useReducedMotion();
  const [stage, setStage] = useState(reduceMotion ? 2 : 0);

  useEffect(() => {
    if (reduceMotion) {
      setStage(2);
      return;
    }

    const timers = [1500, 3100, 4900].map((delay, index) =>
      window.setTimeout(() => {
        setStage(index + 1);
      }, delay),
    );

    return () => {
      timers.forEach((timer) => {
        window.clearTimeout(timer);
      });
    };
  }, [reduceMotion]);

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#080c12] shadow-[0_28px_90px_rgba(2,6,23,.2)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-4 sm:px-6">
        <div>
          <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-200/55">
            Evidence Engine
          </p>
          <p className="m-0 mt-1 text-sm font-semibold text-white/88">
            {stages[stage]}
          </p>
        </div>
        <span className="rounded-full border border-amber-300/20 bg-amber-300/[0.07] px-3 py-1 text-[10px] font-semibold text-amber-100">
          Synthetic walkthrough
        </span>
      </div>

      <div className="grid min-h-[420px] gap-0 lg:grid-cols-[0.72fr_1.28fr]">
        <aside className="border-b border-white/[0.07] p-5 lg:border-b-0 lg:border-r lg:p-6">
          <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/38">
            Evidence sources
          </p>
          <div className="mt-4 grid gap-2.5">
            {sourceItems.map(({ label, detail, icon: Icon }, index) => {
              const active = stage === 0 ? index <= 1 : true;
              return (
                <motion.div
                  key={label}
                  animate={
                    reduceMotion ? undefined : { opacity: active ? 1 : 0.38 }
                  }
                  className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3.5"
                  transition={{ duration: 0.35 }}
                >
                  <span className="grid size-9 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.035]">
                    <Icon
                      className="size-4 text-blue-200/80"
                      aria-hidden="true"
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="m-0 text-sm font-semibold text-white/88">
                      {label}
                    </p>
                    <p className="m-0 mt-0.5 truncate text-[11px] text-white/42">
                      {detail}
                    </p>
                  </div>
                  {stage > 0 ? (
                    <CheckCircle2
                      className="ml-auto size-4 text-emerald-200/70"
                      aria-hidden="true"
                    />
                  ) : null}
                </motion.div>
              );
            })}
          </div>
          <div className="mt-5 flex items-center gap-2 text-[11px] font-medium text-white/35">
            <ArrowDown className="size-3.5" aria-hidden="true" />
            No prompt content is used in this synthetic aggregate-data
            walkthrough.
          </div>
        </aside>

        <div className="relative p-5 sm:p-6 lg:p-7">
          <AnimatePresence mode="wait" initial={false}>
            {stage === 0 ? (
              <motion.div
                key="reading"
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.32 }}
              >
                <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-200/55">
                  Reading usage evidence
                </p>
                <h3 className="mt-3 max-w-[14ch] text-3xl font-semibold leading-[1.02] tracking-[-0.05em] text-white sm:text-4xl">
                  Turn raw provider usage into comparable evidence.
                </h3>
                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                  {[
                    ['Requests', '41.2k'],
                    ['Tokens', '28.6M'],
                    ['Observed spend', '$18,420'],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-white/[0.07] bg-white/[0.022] p-4"
                    >
                      <p className="m-0 text-[9px] font-semibold uppercase tracking-[0.13em] text-white/38">
                        {label}
                      </p>
                      <p className="m-0 mt-2 font-mono text-xl font-semibold text-white/90">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : stage === 1 ? (
              <motion.div
                key="ranking"
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.32 }}
              >
                <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-200/55">
                  Ranking supported opportunities
                </p>
                <h3 className="mt-3 max-w-[15ch] text-3xl font-semibold leading-[1.02] tracking-[-0.05em] text-white sm:text-4xl">
                  Weak guesses fall away. One supported action survives.
                </h3>
                <div className="mt-7 grid gap-2.5">
                  {[
                    ['01', 'Reduce oversized outputs', 'Supported', true],
                    [
                      '02',
                      'Switch every request to a cheaper model',
                      'Needs benchmark evidence',
                      false,
                    ],
                    [
                      '03',
                      'Increase cache reuse',
                      'Insufficient evidence',
                      false,
                    ],
                  ].map(([rank, label, detail, active]) => (
                    <div
                      key={String(rank)}
                      className={
                        active
                          ? 'grid grid-cols-[36px_1fr_auto] items-center gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/[0.065] p-4'
                          : 'grid grid-cols-[36px_1fr_auto] items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-4 opacity-45'
                      }
                    >
                      <span className="font-mono text-[10px] text-white/38">
                        {rank}
                      </span>
                      <div>
                        <p className="m-0 text-sm font-semibold text-white/86">
                          {label}
                        </p>
                        <p className="m-0 mt-1 text-[11px] text-white/42">
                          {detail}
                        </p>
                      </div>
                      {active ? (
                        <CircleDot
                          className="size-4 text-amber-200"
                          aria-hidden="true"
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : stage === 2 ? (
              <motion.div
                key="answer"
                initial={reduceMotion ? false : { opacity: 0, scale: 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0, scale: 0.985 }}
                transition={{ duration: 0.32 }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200/75">
                      Strongest supported answer
                    </p>
                    <h3 className="mt-3 max-w-[17ch] text-3xl font-semibold leading-[1.02] tracking-[-0.05em] text-white sm:text-4xl">
                      Reduce oversized outputs.
                    </h3>
                  </div>
                  <span className="rounded-full border border-amber-300/22 bg-amber-300/[0.08] px-3 py-1 text-[10px] font-semibold text-amber-100">
                    Opportunity
                  </span>
                </div>

                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                  {[
                    ['Spend analyzed', '$18,420'],
                    ['Savings', 'Not measured yet'],
                    ['Detection confidence', 'Medium'],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-white/[0.07] bg-white/[0.022] p-4"
                    >
                      <p className="m-0 text-[9px] font-semibold uppercase tracking-[0.13em] text-white/38">
                        {label}
                      </p>
                      <p className="m-0 mt-2 font-mono text-lg font-semibold text-white/90">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl border border-white/[0.07] bg-white/[0.018] p-4">
                  <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.13em] text-white/38">
                    Recommended next action
                  </p>
                  <p className="m-0 mt-2 text-sm leading-6 text-white/72">
                    Test a shorter response limit against the quality floor
                    before treating savings as achieved.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="proof"
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.32 }}
              >
                <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200/65">
                  Proof state stays honest
                </p>
                <h3 className="mt-3 max-w-[16ch] text-3xl font-semibold leading-[1.02] tracking-[-0.05em] text-white sm:text-4xl">
                  The label changes only when the evidence changes.
                </h3>
                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {proofStates.map(
                    ({ label, detail, icon: StateIcon, classes }) => (
                      <div
                        key={label}
                        className={`rounded-2xl border p-4 ${classes}`}
                      >
                        <StateIcon className="size-4" aria-hidden="true" />
                        <p className="m-0 mt-4 text-sm font-semibold">
                          {label}
                        </p>
                        <p className="m-0 mt-1 text-[11px] opacity-60">
                          {detail}
                        </p>
                      </div>
                    ),
                  )}
                </div>
                <p className="m-0 mt-6 text-xs leading-5 text-white/40">
                  Synthetic example only. These values demonstrate the product
                  logic and are not a customer result.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
