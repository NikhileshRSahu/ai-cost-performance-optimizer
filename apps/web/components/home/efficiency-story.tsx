'use client';

import {
  ArrowDownRight,
  Check,
  CircleDollarSign,
  Gauge,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';
import { useRef, useState } from 'react';
import { EvidenceStatePill } from '../evidence-state-pill';

const chapters = [
  {
    index: '01',
    label: 'Observe',
    title: 'Evidence enters. Claims stay locked.',
    body: 'Usage, cost, token, cache, retry, and outcome evidence is normalized before Evalomics makes a recommendation.',
  },
  {
    index: '02',
    label: 'Diagnose',
    title: 'The waste map resolves itself.',
    body: 'Repeated context, model overqualification, and cache miss patterns are ranked by evidence strength, expected value, and risk.',
  },
  {
    index: '03',
    label: 'Benchmark',
    title: 'One safe hypothesis gets challenged.',
    body: 'The candidate must clear the same quality floor before the recommendation can move from Opportunity to Tested.',
  },
  {
    index: '04',
    label: 'Verify',
    title: 'Only production evidence unlocks the saving.',
    body: 'Post-change evidence is reconciled against the baseline. Until then, the amount stays out of Verified savings.',
  },
] as const;

const signals = [
  ['Repeated context', '$1,420/mo', 'High evidence'],
  ['Model overqualification', '$2,190/mo', 'Benchmark next'],
  ['Cache miss pattern', '$1,260/mo', 'High evidence'],
] as const;

export function EfficiencyStory() {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });

  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    if (reduceMotion) return;
    const next = Math.min(3, Math.floor(value * 4.02));
    setActive((current) => (current === next ? current : next));
  });

  const panelScale = useTransform(
    scrollYProgress,
    [0, 0.2, 0.82, 1],
    reduceMotion ? [1, 1, 1, 1] : [0.94, 1, 1, 0.97],
  );
  const panelRotateX = useTransform(
    scrollYProgress,
    [0, 0.18],
    reduceMotion ? [0, 0] : [7, 0],
  );
  const glowOpacity = useTransform(scrollYProgress, [0.1, 0.8], [0.25, 0.7]);
  const candidateWidth = useTransform(
    scrollYProgress,
    [0.48, 0.68],
    ['94%', '58%'],
  );
  const verifiedOpacity = useTransform(scrollYProgress, [0.72, 0.9], [0, 1]);
  const verifiedY = useTransform(scrollYProgress, [0.72, 0.9], [16, 0]);

  return (
    <section ref={ref} className="relative min-h-[390vh]">
      <div className="sticky top-16 min-h-[calc(100vh-4rem)] overflow-hidden py-8 sm:py-10">
        <div className="grid min-h-[calc(100vh-7rem)] items-center gap-10 lg:grid-cols-[.72fr_1.28fr] lg:gap-14">
          <div className="relative z-10">
            <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Scroll through the decision
            </p>
            <h2 className="mt-4 !text-[clamp(3rem,5.7vw,6.3rem)] !leading-[.9] !tracking-[-.07em] text-slate-950">
              From spend
              <span className="block text-slate-400">to proof.</span>
            </h2>
            <p className="mt-6 max-w-md text-sm leading-6 text-slate-500">
              The interface changes as the evidence state changes. Nothing jumps
              straight from “possible” to “saved.”
            </p>

            <div className="mt-8 grid gap-2">
              {chapters.map((chapter, index) => (
                <button
                  key={chapter.label}
                  type="button"
                  onClick={() => setActive(index)}
                  className={
                    'grid w-full grid-cols-[28px_1fr] gap-3 rounded-2xl border p-4 text-left transition duration-300 ' +
                    (active === index
                      ? 'border-slate-300 bg-white shadow-[0_16px_45px_rgba(15,23,42,.06)]'
                      : 'border-transparent bg-transparent opacity-45 hover:opacity-70')
                  }
                >
                  <span
                    className={
                      'pt-0.5 font-mono text-[10px] font-semibold ' +
                      (active === index ? 'text-blue-600' : 'text-slate-400')
                    }
                  >
                    {chapter.index}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-slate-950">
                      {chapter.label}
                    </span>
                    <span className="mt-1 block text-sm font-medium text-slate-700">
                      {chapter.title}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">
                      {chapter.body}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative [perspective:1400px]">
            <motion.div
              style={{ opacity: glowOpacity }}
              className="pointer-events-none absolute -inset-12 rounded-[44px] bg-[radial-gradient(circle_at_50%_45%,rgba(16,185,129,.18),rgba(59,130,246,.09)_38%,transparent_68%)] blur-3xl"
            />

            <motion.div
              style={{
                scale: panelScale,
                rotateX: panelRotateX,
                transformOrigin: '50% 75%',
              }}
              className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#070c12] text-white shadow-[0_45px_120px_rgba(15,23,42,.25)]"
            >
              <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="grid size-9 place-items-center rounded-xl border border-emerald-300/15 bg-emerald-300/[0.08] text-emerald-200">
                    <ScanSearch className="size-4" />
                  </div>
                  <div>
                    <p className="m-0 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/30">
                      Work MRI · live decision surface
                    </p>
                    <p className="m-0 mt-0.5 text-sm font-semibold text-white/88">
                      Production classification workload
                    </p>
                  </div>
                </div>
                <span className="hidden items-center gap-1.5 rounded-full border border-emerald-300/18 bg-emerald-300/[0.07] px-3 py-1.5 text-[10px] font-semibold text-emerald-200 sm:inline-flex">
                  <span className="size-1.5 rounded-full bg-emerald-300" />
                  Evidence loaded
                </span>
              </div>

              <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
                <article className="rounded-2xl border border-blue-300/15 bg-blue-300/[0.055] p-4">
                  <CircleDollarSign className="size-4 text-blue-200/70" />
                  <p className="m-0 mt-5 text-[9px] font-semibold uppercase tracking-[0.13em] text-white/30">
                    Observed spend
                  </p>
                  <strong className="mt-1.5 block font-mono text-2xl font-medium tracking-[-0.04em] text-white">
                    $18,420
                  </strong>
                  <p className="m-0 mt-1 text-[10px] text-white/32">evidence window</p>
                </article>

                <article className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.05] p-4">
                  <Sparkles className="size-4 text-amber-200/70" />
                  <p className="m-0 mt-5 text-[9px] font-semibold uppercase tracking-[0.13em] text-white/30">
                    Potential waste
                  </p>
                  <strong className="mt-1.5 block font-mono text-2xl font-medium tracking-[-0.04em] text-amber-100">
                    $4,870
                  </strong>
                  <p className="m-0 mt-1 text-[10px] text-white/32">not savings yet</p>
                </article>

                <article className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.05] p-4">
                  <ShieldCheck className="size-4 text-emerald-200/70" />
                  <p className="m-0 mt-5 text-[9px] font-semibold uppercase tracking-[0.13em] text-white/30">
                    Verified net saving
                  </p>
                  <motion.strong
                    style={reduceMotion ? undefined : { opacity: verifiedOpacity }}
                    className="mt-1.5 block font-mono text-2xl font-medium tracking-[-0.04em] text-emerald-100"
                  >
                    {active === 3 || reduceMotion ? '$1,742' : 'Locked'}
                  </motion.strong>
                  <p className="m-0 mt-1 text-[10px] text-white/32">
                    {active === 3 || reduceMotion ? 'post-change proof' : 'requires verification'}
                  </p>
                </article>
              </div>

              <div className="relative min-h-[410px] border-t border-white/[0.06]">
                <motion.div
                  animate={{ opacity: active === 0 ? 1 : 0, y: active === 0 ? 0 : -10 }}
                  transition={{ duration: reduceMotion ? 0 : 0.28 }}
                  className="absolute inset-0 p-5 sm:p-6"
                  aria-hidden={active !== 0}
                >
                  <div className="flex h-full flex-col justify-between rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                    <div>
                      <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-200/55">
                        Evidence ingestion
                      </p>
                      <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white/92">
                        Raw usage becomes an evidence graph.
                      </h3>
                    </div>
                    <div className="grid gap-2">
                      {[
                        ['Provider usage', '12.51M tokens'],
                        ['Requests', '10,000'],
                        ['Outcome success', '91.8%'],
                        ['Cache coverage', '28%'],
                      ].map(([label, value], index) => (
                        <motion.div
                          key={label}
                          initial={reduceMotion ? false : { opacity: 0, x: 12 }}
                          animate={{ opacity: active === 0 ? 1 : 0.3, x: 0 }}
                          transition={{ delay: reduceMotion ? 0 : index * 0.07 }}
                          className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-3"
                        >
                          <span className="text-xs text-white/42">{label}</span>
                          <span className="font-mono text-xs font-semibold text-white/74">{value}</span>
                        </motion.div>
                      ))}
                    </div>
                    <p className="m-0 text-[10px] text-white/28">
                      Illustrative data · no customer result implied
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ opacity: active === 1 ? 1 : 0, y: active === 1 ? 0 : 10 }}
                  transition={{ duration: reduceMotion ? 0 : 0.28 }}
                  className="absolute inset-0 p-5 sm:p-6"
                  aria-hidden={active !== 1}
                >
                  <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025]">
                    <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
                      <div>
                        <p className="m-0 text-sm font-semibold text-white/86">Ranked opportunities</p>
                        <p className="m-0 mt-0.5 text-[10px] text-white/28">
                          evidence strength × expected value × risk
                        </p>
                      </div>
                      <Zap className="size-4 text-amber-200/55" />
                    </div>
                    {signals.map(([label, value, evidence], index) => (
                      <div
                        key={label}
                        className={
                          'grid grid-cols-[30px_1fr_auto] items-center gap-3 border-b border-white/[0.06] px-4 py-4 last:border-0 ' +
                          (index === 1 ? 'bg-amber-300/[0.055]' : '')
                        }
                      >
                        <span className="font-mono text-[10px] font-semibold text-blue-300/55">0{index + 1}</span>
                        <div>
                          <p className="m-0 text-sm font-medium text-white/82">{label}</p>
                          <p className="m-0 mt-1 text-[10px] text-white/30">{evidence}</p>
                        </div>
                        <div className="text-right">
                          <p className="m-0 font-mono text-xs font-semibold text-white/70">{value}</p>
                          {index === 1 ? (
                            <EvidenceStatePill state="OPPORTUNITY" className="mt-1.5" />
                          ) : null}
                        </div>
                      </div>
                    ))}
                    <div className="m-4 flex items-center justify-between gap-4 rounded-xl border border-amber-300/14 bg-amber-300/[0.05] p-3">
                      <div>
                        <p className="m-0 text-[9px] font-semibold uppercase tracking-[0.12em] text-amber-200/50">
                          Selected
                        </p>
                        <p className="m-0 mt-1 text-xs font-medium text-white/72">
                          Test cheaper routing for low-complexity classification.
                        </p>
                      </div>
                      <ArrowDownRight className="size-4 shrink-0 text-amber-200/55" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ opacity: active === 2 ? 1 : 0, y: active === 2 ? 0 : 10 }}
                  transition={{ duration: reduceMotion ? 0 : 0.28 }}
                  className="absolute inset-0 p-5 sm:p-6"
                  aria-hidden={active !== 2}
                >
                  <div className="grid h-full content-between rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-200/55">
                          Candidate benchmark
                        </p>
                        <h3 className="mt-2 text-xl font-semibold tracking-[-0.035em] text-white/90">
                          Cheaper model routing
                        </h3>
                      </div>
                      <EvidenceStatePill state="TESTED" />
                    </div>

                    <div className="grid gap-6">
                      <div>
                        <div className="mb-2 flex justify-between text-xs">
                          <span className="text-white/38">Baseline cost / 1k requests</span>
                          <span className="font-mono font-semibold text-white/74">$12.84</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/[0.07]">
                          <div className="h-full w-full rounded-full bg-white/22" />
                        </div>
                      </div>
                      <div>
                        <div className="mb-2 flex justify-between text-xs">
                          <span className="text-white/38">Candidate cost / 1k requests</span>
                          <span className="font-mono font-semibold text-emerald-200">$7.43</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/[0.07]">
                          <motion.div
                            style={reduceMotion ? { width: '58%' } : { width: candidateWidth }}
                            className="h-full rounded-full bg-emerald-300/75"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/[0.08] bg-[#080d14] p-4">
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="m-0 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/28">
                            Quality guard
                          </p>
                          <p className="m-0 mt-1 font-mono text-2xl text-white/88">0.93</p>
                        </div>
                        <div className="text-right">
                          <p className="m-0 text-[9px] text-white/28">required floor</p>
                          <p className="m-0 mt-1 font-mono text-sm text-blue-200">0.90</p>
                        </div>
                      </div>
                      <div className="relative mt-3 h-2 rounded-full bg-white/[0.07]">
                        <div className="absolute left-[90%] top-[-4px] h-4 w-px bg-blue-300/80" />
                        <div className="h-full w-[93%] rounded-full bg-gradient-to-r from-blue-400/55 to-emerald-300/80" />
                      </div>
                      <p className="m-0 mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-emerald-200/70">
                        <Check className="size-3.5" /> Candidate clears the quality floor
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  style={reduceMotion ? undefined : { opacity: verifiedOpacity, y: verifiedY }}
                  animate={reduceMotion ? { opacity: active === 3 ? 1 : 0 } : undefined}
                  className="absolute inset-0 p-5 sm:p-6"
                  aria-hidden={active !== 3}
                >
                  <div className="grid h-full content-between rounded-2xl border border-emerald-300/16 bg-emerald-300/[0.045] p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-200/55">
                          Post-change verification
                        </p>
                        <h3 className="mt-2 max-w-lg text-2xl font-semibold tracking-[-0.04em] text-white/92">
                          The saving is unlocked only after production evidence agrees.
                        </h3>
                      </div>
                      <EvidenceStatePill state="VERIFIED" />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      {[
                        ['Baseline', '$18,420'],
                        ['Post-change', '$16,522'],
                        ['Quality', '0.93'],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-xl border border-white/[0.07] bg-black/10 p-4">
                          <p className="m-0 text-[9px] uppercase tracking-[0.12em] text-white/28">{label}</p>
                          <p className="m-0 mt-2 font-mono text-xl font-medium text-white/82">{value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col gap-4 rounded-2xl border border-emerald-300/18 bg-emerald-300/[0.07] p-4 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="m-0 text-[9px] font-semibold uppercase tracking-[0.14em] text-emerald-200/50">
                          Verified net saving
                        </p>
                        <p className="m-0 mt-1 font-mono text-4xl font-medium tracking-[-0.05em] text-emerald-100">
                          $1,742/mo
                        </p>
                      </div>
                      <p className="m-0 max-w-xs text-xs leading-5 text-emerald-50/45">
                        Illustrative interface. In the product, this state requires
                        comparable post-change customer evidence.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
