'use client';

import {
  ArrowDownRight,
  CheckCircle2,
  FlaskConical,
  ScanSearch,
  ShieldCheck,
} from 'lucide-react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { EvidenceStatePill } from '../evidence-state-pill';

const chapters = [
  {
    id: 'observe',
    index: '01',
    label: 'Observe',
    title: 'Start with evidence you already own.',
    body: 'CSV, OpenAI usage, or Anthropic usage becomes one canonical evidence layer. Prompt content is not required for the usage MRI.',
    icon: ScanSearch,
  },
  {
    id: 'diagnose',
    index: '02',
    label: 'Diagnose',
    title: 'Find waste without inventing a saving.',
    body: 'Evalomics surfaces repeated context, cache gaps, retries, model concentration, and outcome inefficiency only where the evidence supports the claim.',
    icon: ArrowDownRight,
  },
  {
    id: 'benchmark',
    index: '03',
    label: 'Benchmark',
    title: 'Challenge the cheapest safe hypothesis.',
    body: 'Baseline and candidate are compared against the same quality, latency, and failure-rate guardrails before a change earns a Tested state.',
    icon: FlaskConical,
  },
  {
    id: 'verify',
    index: '04',
    label: 'Verify',
    title: 'Call it a saving only after production proves it.',
    body: 'Post-change evidence is reconciled against the baseline. Neutral and negative outcomes stay visible instead of being rewritten into success.',
    icon: ShieldCheck,
  },
] as const;

export function ProofScrollStory() {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });
  const progress = useTransform(scrollYProgress, [0, 1], [4, 100]);
  const candidateCost = useTransform(
    scrollYProgress,
    [0.36, 0.68],
    ['92%', '58%'],
  );
  const verifiedOpacity = useTransform(
    scrollYProgress,
    [0.72, 0.88],
    [0.25, 1],
  );

  return (
    <section
      ref={ref}
      id="proof-loop"
      className="relative mt-24 min-h-[150vh] md:mt-32"
      aria-labelledby="proof-story-title"
    >
      <div className="sticky top-20 grid min-h-[calc(100vh-6rem)] items-center gap-10 py-8 lg:grid-cols-[.78fr_1.22fr] lg:gap-14">
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
            The proof loop
          </p>
          <h2
            id="proof-story-title"
            className="mt-4 !text-[clamp(2.7rem,5vw,5.1rem)] !leading-[.96] !tracking-[-.06em] text-slate-950"
          >
            One decision.
            <span className="block text-slate-400">Four evidence gates.</span>
          </h2>
          <p className="mt-6 max-w-lg text-base leading-7 text-slate-500">
            The interface should make the trust model obvious before a customer
            reads the methodology.
          </p>

          <div className="mt-9 grid gap-2.5">
            {chapters.map(({ index, label, title, body, icon: Icon }) => (
              <article
                key={label}
                className="group grid grid-cols-[32px_1fr] gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-[0_12px_38px_rgba(15,23,42,.035)] backdrop-blur"
              >
                <span className="pt-0.5 font-mono text-[10px] font-semibold text-blue-600">
                  {index}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <Icon className="size-4 text-slate-400" />
                    <p className="m-0 text-sm font-semibold text-slate-950">
                      {label}
                    </p>
                  </div>
                  <p className="m-0 mt-1.5 text-sm font-medium text-slate-700">
                    {title}
                  </p>
                  <p className="m-0 mt-1 text-xs leading-5 text-slate-500">
                    {body}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[#080d14] p-5 text-white shadow-[0_32px_90px_rgba(15,23,42,.2)] sm:p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_0%,rgba(16,185,129,.12),transparent_32%),radial-gradient(circle_at_25%_100%,rgba(59,130,246,.09),transparent_38%)]" />
          <div className="relative">
            <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] pb-4">
              <div>
                <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/32">
                  Candidate model benchmark
                </p>
                <p className="m-0 mt-1 text-sm font-semibold text-white/88">
                  Classification · production
                </p>
              </div>
              <EvidenceStatePill state="TESTED" />
            </div>

            <div className="mt-6 grid gap-5">
              <div>
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-white/45">Current cost / 1k requests</span>
                  <span className="font-mono font-semibold text-white/80">$12.84</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.07]">
                  <div className="h-full w-full rounded-full bg-white/26" />
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-white/45">Candidate cost / 1k requests</span>
                  <span className="font-mono font-semibold text-emerald-200">$7.43</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.07]">
                  {reduceMotion ? (
                    <div className="h-full w-[58%] rounded-full bg-emerald-300/70" />
                  ) : (
                    <motion.div
                      className="h-full rounded-full bg-emerald-300/70"
                      style={{ width: candidateCost }}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.13em] text-white/32">
                    Quality guard
                  </p>
                  <p className="m-0 mt-1.5 font-mono text-xl font-medium text-white/90">
                    0.93
                  </p>
                </div>
                <div className="text-right">
                  <p className="m-0 text-[10px] text-white/30">required floor</p>
                  <p className="m-0 mt-1 font-mono text-sm text-blue-200">0.90</p>
                </div>
              </div>
              <div className="relative mt-4 h-2 overflow-hidden rounded-full bg-white/[0.07]">
                <div className="absolute left-[90%] top-[-4px] h-4 w-px bg-blue-300/80" />
                <div className="h-full w-[93%] rounded-full bg-gradient-to-r from-blue-400/50 to-emerald-300/80" />
              </div>
              <p className="m-0 mt-3 flex items-center gap-1.5 text-[11px] font-medium text-emerald-200/75">
                <CheckCircle2 className="size-3.5" /> Candidate stays above the floor
              </p>
            </div>

            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.12em] text-white/30">
                <span>Proof progression</span>
                <span>scroll</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
                {reduceMotion ? (
                  <div className="h-full w-full bg-gradient-to-r from-blue-400 via-amber-300 to-emerald-300" />
                ) : (
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-400 via-amber-300 to-emerald-300"
                    style={{ width: progress }}
                  />
                )}
              </div>
            </div>

            <motion.div
              style={reduceMotion ? undefined : { opacity: verifiedOpacity }}
              className="mt-6 flex flex-col gap-3 rounded-2xl border border-emerald-300/18 bg-emerald-300/[0.07] p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-200/45">
                  Verified net saving
                </p>
                <p className="m-0 mt-1 font-mono text-2xl font-medium text-emerald-100">
                  $1,742/mo
                </p>
              </div>
              <span className="text-[10px] font-medium text-emerald-200/55">
                illustrative interface
              </span>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
