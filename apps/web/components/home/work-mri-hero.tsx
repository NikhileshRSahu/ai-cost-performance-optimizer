'use client';

import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  Gauge,
  ScanLine,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import Velaris from '../ui/velaris';
import { MetricTile } from '../metric-tile';
import { EvidenceStatePill } from '../evidence-state-pill';
import { ProofTimeline } from '../proof-timeline';

const COLORS = ['#173e72', '#0c7a5a', '#064e3b', '#020617'];

const signals = [
  {
    label: 'Repeated context',
    detail: 'Prompt overlap · high evidence',
    value: '$1,420/mo',
    state: 'OPPORTUNITY' as const,
  },
  {
    label: 'Model overqualification',
    detail: 'Quality headroom · benchmark next',
    value: '$2,190/mo',
    state: 'TESTED' as const,
  },
  {
    label: 'Cache miss pattern',
    detail: 'Reusable prefix · high evidence',
    value: '$1,260/mo',
    state: 'OPPORTUNITY' as const,
  },
];

export function WorkMriHero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[#04070b] shadow-[0_38px_120px_rgba(4,10,20,.22)]">
      <Velaris
        height="auto"
        className="min-h-[760px]"
        bg="#020407"
        colors={COLORS}
        speed={reduceMotion ? 0 : 0.8}
        grain={reduceMotion ? 0.08 : 0.16}
      >
        <div className="relative min-h-[760px] px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_32%_34%,rgba(3,7,18,.14),rgba(3,7,18,.74)_60%,rgba(3,7,18,.94)_100%)]" />
          <div className="relative z-10 grid min-h-[680px] items-center gap-10 lg:grid-cols-[.84fr_1.16fr] lg:gap-12">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
              className="max-w-xl"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.07] px-3 py-1.5 text-[11px] font-semibold tracking-wide text-white/68 backdrop-blur-xl">
                <span className="size-1.5 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,.8)]" />
                AI Efficiency Intelligence
              </div>

              <h1 className="mt-7 !text-[clamp(3.4rem,6.8vw,6.7rem)] !leading-[.88] !tracking-[-.07em] text-white">
                Find AI waste.
                <span className="mt-2 block bg-gradient-to-r from-emerald-200 via-white to-blue-200 bg-clip-text text-transparent">
                  Prove the fix.
                </span>
              </h1>

              <p className="mt-7 max-w-[600px] text-base leading-7 text-white/58 sm:text-lg">
                Evalomics turns usage evidence into a Work MRI: detect waste,
                rank the safest change, benchmark it against your quality
                floor, and verify what actually improved.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/login"
                  className="group inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 no-underline shadow-[0_10px_35px_rgba(255,255,255,.12)] transition hover:-translate-y-0.5 hover:bg-emerald-100"
                >
                  Run the free Work MRI
                  <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="#proof-loop"
                  className="inline-flex min-h-12 items-center rounded-xl border border-white/18 bg-white/[0.075] px-5 py-3 text-sm font-semibold text-white no-underline backdrop-blur-xl transition hover:border-white/28 hover:bg-white/[0.11]"
                >
                  See how proof works
                </Link>
              </div>

              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-medium text-white/42">
                <span>✓ CSV-first</span>
                <span>✓ No prompt content required</span>
                <span>✓ No invented savings</span>
                <span>✓ Potential ≠ Verified</span>
              </div>
            </motion.div>

            <motion.div
              initial={reduceMotion ? false : { opacity: 0, scale: 0.975, y: 20 }}
              animate={reduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.12, ease: [0.2, 0.8, 0.2, 1] }}
              className="relative"
            >
              <div className="absolute -inset-5 rounded-[32px] bg-gradient-to-br from-emerald-300/10 via-blue-300/[0.04] to-transparent blur-2xl" />
              <div className="relative overflow-hidden rounded-[22px] border border-white/12 bg-[#080d14]/94 shadow-[0_30px_90px_rgba(0,0,0,.45)] backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="grid size-9 place-items-center rounded-xl border border-blue-300/15 bg-blue-300/[0.08] text-blue-200">
                      <ScanLine className="size-4" />
                    </div>
                    <div>
                      <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.17em] text-white/32">
                        Work MRI
                      </p>
                      <p className="m-0 mt-0.5 text-sm font-semibold text-white/90">
                        Production workload
                      </p>
                    </div>
                  </div>
                  <div className="hidden items-center gap-2 rounded-full border border-emerald-300/18 bg-emerald-300/[0.08] px-3 py-1.5 text-[10px] font-semibold text-emerald-200 sm:flex">
                    <span className="size-1.5 rounded-full bg-emerald-300" />
                    Evidence loaded
                  </div>
                </div>

                <div className="grid gap-2.5 p-4 sm:grid-cols-3 sm:p-5">
                  <MetricTile
                    label="Observed spend"
                    value="$18,420"
                    detail="Illustrative monthly evidence"
                    tone="evidence"
                    icon={<CircleDollarSign className="size-4" />}
                  />
                  <MetricTile
                    label="Potential"
                    value="$4,870"
                    detail="Requires controlled testing"
                    tone="potential"
                    icon={<Sparkles className="size-4" />}
                  />
                  <MetricTile
                    label="Verified"
                    value="$1,742"
                    detail="Illustrative post-change proof"
                    tone="verified"
                    icon={<ShieldCheck className="size-4" />}
                  />
                </div>

                <div className="mx-4 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.022] sm:mx-5">
                  <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
                    <div>
                      <p className="m-0 text-sm font-semibold text-white/88">
                        Ranked opportunities
                      </p>
                      <p className="m-0 mt-0.5 text-[10px] text-white/32">
                        evidence strength × value × risk
                      </p>
                    </div>
                    <Gauge className="size-4 text-white/30" />
                  </div>

                  {signals.map((signal, index) => (
                    <motion.div
                      key={signal.label}
                      initial={reduceMotion ? false : { opacity: 0, x: 10 }}
                      animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.32 + index * 0.1 }}
                      className="grid grid-cols-[28px_1fr_auto] items-center gap-3 border-b border-white/[0.06] px-4 py-3.5 last:border-0"
                    >
                      <span className="font-mono text-[10px] font-semibold text-blue-300/65">
                        0{index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="m-0 truncate text-sm font-medium text-white/86">
                          {signal.label}
                        </p>
                        <p className="m-0 mt-1 truncate text-[10px] text-white/30">
                          {signal.detail}
                        </p>
                      </div>
                      <div className="grid justify-items-end gap-1.5">
                        <span className="font-mono text-xs font-semibold text-white/75">
                          {signal.value}
                        </span>
                        <EvidenceStatePill state={signal.state} />
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="p-5">
                  <ProofTimeline current="Verified" compact />
                  <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-emerald-300/14 bg-emerald-300/[0.055] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-200/50">
                        Selected recommendation
                      </p>
                      <p className="m-0 mt-1.5 max-w-md text-xs font-medium leading-5 text-emerald-50/82">
                        Route low-complexity classification to a cheaper candidate
                        only after the quality floor holds.
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5 text-[10px] font-semibold text-emerald-200/75">
                      <CheckCircle2 className="size-3.5" />
                      Quality floor passed
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-right text-[10px] text-white/28">
                Illustrative interface · not a customer result
              </p>
            </motion.div>
          </div>
        </div>
      </Velaris>
    </section>
  );
}
