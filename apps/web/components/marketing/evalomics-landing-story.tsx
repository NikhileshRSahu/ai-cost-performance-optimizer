'use client';

import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Database,
  Sparkles,
  Target,
  TestTube2,
  WandSparkles,
} from 'lucide-react';
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';
import { useRef, useState } from 'react';

const chapters = [
  {
    kicker: '01 · Observe',
    title: 'Start with the bill.',
    copy: 'Connect OpenAI or Anthropic, or upload a CSV. Evalomics reconstructs what your AI workload is actually doing before it makes a recommendation.',
    metric: '$1,774.78',
    metricLabel: 'Observed spend',
    icon: Database,
  },
  {
    kicker: '02 · Detect',
    title: 'Find the expensive pattern.',
    copy: 'Repeated input, oversized context, model mismatch and routing inefficiency become ranked opportunities instead of vague cost advice.',
    metric: '$286–$421',
    metricLabel: 'Modeled upside',
    icon: Target,
  },
  {
    kicker: '03 · Test',
    title: 'Challenge the recommendation.',
    copy: 'A saving is not real because a model predicted it. Evalomics benchmarks the alternative against your quality floor before you act.',
    metric: '96.8%',
    metricLabel: 'Quality retained',
    icon: TestTube2,
  },
  {
    kicker: '04 · Verify',
    title: 'Only count what survived reality.',
    copy: 'Potential, tested and verified stay separate. After the change, Evalomics measures the production result and closes the loop with evidence.',
    metric: '$312.40',
    metricLabel: 'Verified savings',
    icon: CheckCircle2,
  },
];

function ProductFrame({ active }: { active: number }) {
  const chapter = chapters[active];
  const Icon = chapter.icon;

  return (
    <div className="relative">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-4 h-48 w-[70%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(124,92,255,.34),rgba(124,92,255,0)_70%)] blur-3xl"
        animate={{ opacity: [0.45, 0.9, 0.45], scale: [0.96, 1.04, 0.96] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative overflow-hidden rounded-[28px] border border-white/[0.09] bg-white/[0.035] p-2 shadow-[0_36px_120px_rgba(0,0,0,.55)] backdrop-blur-xl">
        <div className="overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#0a0f18]">
          <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-rose-400/70" />
              <span className="size-2.5 rounded-full bg-amber-300/70" />
              <span className="size-2.5 rounded-full bg-emerald-300/70" />
            </div>
            <span className="font-mono text-[10px] text-white/35">evalomics / live analysis</span>
          </div>

          <div className="grid min-h-[470px] md:grid-cols-[180px_1fr]">
            <aside className="hidden border-r border-white/[0.06] bg-white/[0.02] p-4 md:block">
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-lg bg-violet-300 text-xs font-black text-[#090c12]">E</span>
                <div>
                  <p className="m-0 text-xs font-semibold text-white">Evalomics</p>
                  <p className="m-0 mt-0.5 text-[9px] text-white/35">AI efficiency intelligence</p>
                </div>
              </div>

              <div className="mt-8 grid gap-1">
                {['Cost', 'Signals', 'Tests', 'Verification'].map((item, index) => (
                  <div
                    key={item}
                    className={
                      index === active
                        ? 'rounded-lg border border-violet-300/15 bg-violet-300/[0.08] px-3 py-2.5 text-xs text-violet-100'
                        : 'rounded-lg px-3 py-2.5 text-xs text-white/35'
                    }
                  >
                    {item}
                  </div>
                ))}
              </div>
            </aside>

            <div className="p-4 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="m-0 text-[9px] font-semibold uppercase tracking-[0.16em] text-violet-200/55">
                    {chapter.kicker}
                  </p>
                  <h3 className="m-0 mt-2 text-xl font-semibold tracking-[-0.035em] text-white sm:text-2xl">
                    {chapter.title}
                  </h3>
                </div>
                <motion.span
                  key={active}
                  initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  className="grid size-10 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-violet-200"
                >
                  <Icon className="size-4" />
                </motion.span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  ['Observed spend', '$1,774.78'],
                  ['Requests', '22,380'],
                  ['Candidates', '3'],
                ].map(([label, value], index) => (
                  <div
                    key={label}
                    className={
                      index === Math.min(active, 2)
                        ? 'rounded-xl border border-violet-300/15 bg-violet-300/[0.06] p-3'
                        : 'rounded-xl border border-white/[0.06] bg-white/[0.025] p-3'
                    }
                  >
                    <p className="m-0 text-[9px] uppercase tracking-[0.1em] text-white/32">{label}</p>
                    <p className="m-0 mt-2 font-mono text-sm text-white/82">{value}</p>
                  </div>
                ))}
              </div>

              <motion.div
                key={chapter.metricLabel}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="mt-4 rounded-2xl border border-white/[0.07] bg-[linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.018))] p-5"
              >
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="m-0 text-[10px] uppercase tracking-[0.14em] text-white/35">{chapter.metricLabel}</p>
                    <p className="m-0 mt-3 font-mono text-[clamp(2rem,6vw,4rem)] leading-none tracking-[-0.06em] text-white">
                      {chapter.metric}
                    </p>
                  </div>
                  <span className="rounded-full border border-emerald-300/20 bg-emerald-300/[0.08] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-emerald-200">
                    evidence-linked
                  </span>
                </div>

                <div className="relative mt-6 h-2 overflow-hidden rounded-full bg-white/[0.05]">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full bg-[linear-gradient(90deg,#7aa7ff,#a78bfa,#6ee7b7)]"
                    initial={false}
                    animate={{ width: `${25 + active * 25}%` }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-4">
                  {['Observed', 'Potential', 'Tested', 'Verified'].map((state, index) => (
                    <div key={state} className="flex items-center gap-2 text-[10px] text-white/42">
                      <span className={index <= active ? 'size-1.5 rounded-full bg-emerald-300' : 'size-1.5 rounded-full bg-white/15'} />
                      {state}
                    </div>
                  ))}
                </div>
              </motion.div>

              <div className="mt-4 rounded-xl border border-white/[0.06] bg-black/20 p-4">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-200/60">
                  <Sparkles className="size-3.5" />
                  strongest next action
                </div>
                <p className="m-0 mt-2 text-sm leading-6 text-white/70">
                  {active < 2
                    ? 'Benchmark cache reuse on repeated input before changing production traffic.'
                    : active === 2
                      ? 'Quality floor passed. Prepare a controlled production rollout.'
                      : 'Production result verified. Savings can now be counted as achieved.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EvalomicsLandingStory() {
  const reduceMotion = useReducedMotion();
  const storyRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({
    target: storyRef,
    offset: ['start start', 'end end'],
  });

  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    if (reduceMotion) return;
    const next = Math.min(chapters.length - 1, Math.floor(value * chapters.length));
    setActive(next);
  });

  const heroY = useTransform(scrollYProgress, [0, 0.16], [0, -30]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0.7]);

  return (
    <div className="overflow-hidden bg-[#050510] text-white">
      <section className="relative min-h-[92vh] overflow-hidden">
        <motion.div
          aria-hidden
          className="absolute left-1/2 top-[-12rem] h-[40rem] w-[72rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(111,83,255,.26),rgba(40,51,116,.12)_38%,transparent_72%)] blur-2xl"
          animate={reduceMotion ? undefined : { scale: [0.96, 1.04, 0.96], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative mx-auto flex w-[min(1320px,calc(100%-2rem))] flex-col items-center pb-12 pt-20 text-center sm:pt-28">
          <motion.div style={{ y: heroY, opacity: heroOpacity }} className="flex flex-col items-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.035] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-violet-100/65 backdrop-blur">
              <WandSparkles className="size-3.5" />
              AI efficiency intelligence
            </div>

            <h1 className="mt-7 max-w-[10ch] text-[clamp(3.7rem,9vw,8.4rem)] font-semibold leading-[0.84] tracking-[-0.078em] text-white">
              Make AI spend explain itself.
            </h1>

            <p className="mt-7 max-w-2xl text-sm leading-6 text-white/48 sm:text-lg sm:leading-8">
              Evalomics finds where AI money is leaking, tests safer alternatives, and separates what looks promising from what actually saved money.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/start" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 no-underline transition hover:-translate-y-0.5 hover:bg-violet-100">
                Analyze my AI usage <ArrowRight className="size-4" />
              </Link>
              <Link href="/demo" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/[0.11] bg-white/[0.035] px-5 py-3 text-sm font-semibold text-white no-underline transition hover:bg-white/[0.07]">
                See a real analysis
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 36, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.45, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mt-14 w-full"
          >
            <ProductFrame active={0} />
          </motion.div>
        </div>
      </section>

      <section ref={storyRef} className="relative">
        <div className="mx-auto grid w-[min(1320px,calc(100%-2rem))] gap-10 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="py-16 lg:py-[18vh]">
            <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-200/55">One continuous story</p>
            <h2 className="mt-3 max-w-[8ch] text-[clamp(2.8rem,6vw,5.8rem)] font-semibold leading-[0.9] tracking-[-0.065em]">
              From invoice to evidence.
            </h2>

            <div className="mt-12 grid">
              {chapters.map((chapter) => (
                <article key={chapter.kicker} className="min-h-[58vh] border-t border-white/[0.07] py-10 lg:min-h-[66vh]">
                  <div className="max-w-lg">
                    <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/52">{chapter.kicker}</p>
                    <h3 className="m-0 mt-3 text-3xl font-semibold tracking-[-0.045em] text-white sm:text-4xl">{chapter.title}</h3>
                    <p className="m-0 mt-4 text-sm leading-6 text-white/45 sm:text-base sm:leading-7">{chapter.copy}</p>
                    <div className="mt-7 flex items-end gap-3">
                      <span className="font-mono text-3xl tracking-[-0.04em] text-white">{chapter.metric}</span>
                      <span className="pb-1 text-[10px] uppercase tracking-[0.12em] text-white/30">{chapter.metricLabel}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-16 flex min-h-screen items-center py-16">
              <div className="w-full">
                <ProductFrame active={active} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/[0.07] py-20 sm:py-28">
        <div className="mx-auto grid w-[min(1120px,calc(100%-2rem))] gap-8 rounded-[30px] border border-white/[0.08] bg-[radial-gradient(circle_at_80%_20%,rgba(111,83,255,.14),transparent_36%),rgba(255,255,255,.025)] p-6 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200/55">No dashboard tourism</p>
            <h2 className="m-0 mt-3 max-w-[12ch] text-[clamp(2.5rem,5vw,4.7rem)] font-semibold leading-[0.92] tracking-[-0.055em]">
              Give us usage. Get the next best action.
            </h2>
            <p className="m-0 mt-5 max-w-xl text-sm leading-6 text-white/45">
              The details stay available when you need them. The default experience stays simple: connect, analyze, decide.
            </p>
          </div>

          <Link href="/start" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 no-underline transition hover:-translate-y-0.5 hover:bg-violet-100">
            Start analysis <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
