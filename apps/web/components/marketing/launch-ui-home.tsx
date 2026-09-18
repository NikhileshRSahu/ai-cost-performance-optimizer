import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Cloud,
  Database,
  FileSpreadsheet,
  Gauge,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  TestTube2,
  TrendingDown,
  UploadCloud,
} from 'lucide-react';

const evidenceSteps = [
  {
    label: 'Observed',
    description: 'Measured from the usage you connected.',
    icon: Database,
    active: true,
  },
  {
    label: 'Potential',
    description: 'A savings opportunity supported by evidence.',
    icon: SearchCheck,
    active: true,
  },
  {
    label: 'Tested',
    description: 'An alternative measured against your quality floor.',
    icon: TestTube2,
    active: false,
  },
  {
    label: 'Verified',
    description: 'Savings reconciled after the production change.',
    icon: CheckCircle2,
    active: false,
  },
] as const;

const workflow = [
  {
    eyebrow: '01 · Connect',
    title: 'Give Evalomics one source.',
    body: 'Connect an AI provider or upload a usage CSV. No multi-step setup maze before you can see value.',
    icon: UploadCloud,
  },
  {
    eyebrow: '02 · Understand',
    title: 'See the strongest opportunity first.',
    body: 'Spend, waste signals, confidence, and the next action are condensed into one decision surface.',
    icon: Gauge,
  },
  {
    eyebrow: '03 · Prove',
    title: 'Promote claims only when evidence improves.',
    body: 'Potential savings stay potential until a benchmark is tested and production results are verified.',
    icon: ShieldCheck,
  },
] as const;

export function LaunchUiHomeHero() {
  return (
    <>
      <section className="relative overflow-hidden bg-[#050510] px-4 pb-16 pt-28 text-white sm:pb-24 sm:pt-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-75"
          style={{
            background:
              'radial-gradient(circle at 50% 12%, rgba(139,92,246,.22), transparent 34%), radial-gradient(circle at 78% 32%, rgba(56,189,248,.10), transparent 30%)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)',
            backgroundSize: '72px 72px',
            maskImage:
              'linear-gradient(to bottom, black 0%, rgba(0,0,0,.62) 46%, transparent 90%)',
          }}
        />

        <div className="relative mx-auto flex w-[min(1180px,100%)] flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/15 bg-white/[0.045] px-3 py-1.5 text-[11px] font-semibold text-violet-100/78 shadow-[inset_0_1px_rgba(255,255,255,.06)] backdrop-blur">
            <Sparkles className="size-3.5 text-violet-300" />
            Evidence-first AI cost optimization
            <span className="h-3 w-px bg-white/12" />
            <span className="text-white/45">Public beta</span>
          </div>

          <h1 className="mt-7 max-w-[1040px] bg-gradient-to-b from-white via-white to-white/48 bg-clip-text text-[clamp(3.2rem,8vw,7.4rem)] font-semibold leading-[0.9] tracking-[-0.072em] text-transparent">
            Turn AI spend into
            <span className="block">verified efficiency.</span>
          </h1>

          <p className="mt-7 max-w-[760px] text-balance text-base font-medium leading-7 text-white/52 sm:text-xl sm:leading-8">
            Connect OpenAI or Anthropic, or upload a usage CSV. Evalomics finds
            the strongest optimization opportunity, tests safer alternatives,
            and keeps potential, tested, and verified savings visibly separate.
          </p>

          <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/start"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 no-underline shadow-[0_10px_40px_rgba(255,255,255,.12)] transition hover:-translate-y-0.5 hover:bg-violet-100"
            >
              Analyze my AI usage <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.045] px-5 py-3 text-sm font-semibold text-white no-underline backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/[0.08]"
            >
              Explore live demo
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-medium text-white/34">
            <span className="inline-flex items-center gap-1.5">
              <Cloud className="size-3.5" /> OpenAI
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Cloud className="size-3.5" /> Anthropic
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FileSpreadsheet className="size-3.5" /> CSV
            </span>
            <span className="text-white/18">•</span>
            <span>No credit card</span>
          </div>

          <div className="relative mt-14 w-full sm:mt-20">
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-0 h-52 w-[72%] -translate-x-1/2 rounded-full bg-violet-500/20 blur-[100px]"
            />

            <div className="relative rounded-[30px] border border-white/[0.10] bg-white/[0.035] p-2 shadow-[0_60px_180px_rgba(0,0,0,.58)] backdrop-blur sm:p-3">
              <div className="overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#08101b] text-left">
                <div className="flex min-h-12 items-center justify-between border-b border-white/[0.07] bg-[#0b1220] px-4 sm:px-5">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-[#ff6b67]/70" />
                    <span className="size-2.5 rounded-full bg-[#f6c65b]/70" />
                    <span className="size-2.5 rounded-full bg-[#4cc38a]/70" />
                  </div>
                  <div className="hidden items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.025] px-3 py-1.5 text-[10px] font-medium text-white/38 sm:flex">
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                    OpenAI usage · analyzed
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/24">
                    Evalomics result
                  </span>
                </div>

                <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[1.15fr_.85fr] lg:p-8">
                  <div className="rounded-[20px] border border-white/[0.07] bg-[#0d1725] p-5 sm:p-6">
                    <div className="flex flex-col gap-4 border-b border-white/[0.06] pb-5 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.07] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.13em] text-emerald-300">
                          <CheckCircle2 className="size-3" />
                          Analysis complete
                        </div>
                        <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">
                          Your biggest saving opportunity is repeated input.
                        </h2>
                        <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6">
                          Evalomics found a concentrated set of requests where
                          cache reuse may lower cost without changing the model
                          or user-visible behavior.
                        </p>
                      </div>
                      <span className="shrink-0 rounded-lg border border-violet-300/15 bg-violet-300/[0.06] px-3 py-2 text-[10px] font-semibold text-violet-200">
                        Confidence · Medium
                      </span>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      {[
                        ['Observed spend', '$1,774.78', 'Measured'],
                        ['Modeled upside', '$286–$421', 'Potential'],
                        ['Verified savings', '$0.00', 'Not yet verified'],
                      ].map(([label, value, meta]) => (
                        <div
                          key={label}
                          className="rounded-xl border border-white/[0.06] bg-[#09111d] p-4"
                        >
                          <p className="m-0 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                            {label}
                          </p>
                          <p className="m-0 mt-3 font-mono text-xl text-slate-100">
                            {value}
                          </p>
                          <p className="m-0 mt-1 text-[10px] text-slate-600">
                            {meta}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 flex flex-col gap-4 rounded-xl border border-sky-300/10 bg-sky-300/[0.035] p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="m-0 text-[9px] font-semibold uppercase tracking-[0.13em] text-sky-300/65">
                          Recommended next action
                        </p>
                        <p className="m-0 mt-1.5 text-sm font-medium text-slate-200">
                          Benchmark cache reuse against your required quality floor.
                        </p>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-2 text-xs font-semibold text-sky-300">
                        See details <ArrowRight className="size-3.5" />
                      </span>
                    </div>
                  </div>

                  <aside className="rounded-[20px] border border-white/[0.07] bg-[#0b1420] p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="m-0 text-[9px] font-semibold uppercase tracking-[0.13em] text-violet-300/60">
                          Evidence ladder
                        </p>
                        <h3 className="m-0 mt-2 text-base font-semibold text-slate-100">
                          What can Evalomics claim?
                        </h3>
                      </div>
                      <TrendingDown className="size-5 text-violet-300/65" />
                    </div>

                    <div className="mt-5 grid gap-2">
                      {evidenceSteps.map((step, index) => {
                        const Icon = step.icon;
                        return (
                          <div
                            key={step.label}
                            className={
                              step.active
                                ? 'flex items-center gap-3 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.045] p-3.5'
                                : 'flex items-center gap-3 rounded-xl border border-white/[0.055] bg-white/[0.018] p-3.5'
                            }
                          >
                            <span
                              className={
                                step.active
                                  ? 'grid size-8 place-items-center rounded-lg bg-emerald-400/10 text-emerald-300'
                                  : 'grid size-8 place-items-center rounded-lg bg-white/[0.035] text-slate-600'
                              }
                            >
                              <Icon className="size-4" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-3">
                                <span
                                  className={
                                    step.active
                                      ? 'text-xs font-semibold text-slate-200'
                                      : 'text-xs font-semibold text-slate-500'
                                  }
                                >
                                  {step.label}
                                </span>
                                <span className="font-mono text-[9px] text-slate-700">
                                  0{index + 1}
                                </span>
                              </div>
                              <p className="m-0 mt-1 text-[10px] leading-4 text-slate-600">
                                {step.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </aside>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/[0.06] bg-[#070914] px-4 py-16 text-white sm:py-24">
        <div className="mx-auto w-[min(1180px,100%)]">
          <div className="grid gap-5 lg:grid-cols-[.82fr_1.18fr] lg:items-end">
            <div>
              <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-300/65">
                One simple product flow
              </p>
              <h2 className="mt-3 max-w-[12ch] text-[clamp(2.5rem,5vw,4.7rem)] font-semibold leading-[0.94] tracking-[-0.058em]">
                Connect once. Get the answer. Inspect proof only when you need it.
              </h2>
            </div>
            <p className="m-0 max-w-2xl justify-self-end text-sm leading-6 text-white/42 sm:text-base sm:leading-7">
              Evalomics keeps the default experience short. Deeper evidence,
              methodology, benchmark details, and source IDs stay behind
              “See details” instead of blocking the first useful result.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {workflow.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.eyebrow}
                  className="group relative overflow-hidden rounded-[22px] border border-white/[0.07] bg-gradient-to-b from-white/[0.045] to-white/[0.018] p-6 shadow-[inset_0_1px_rgba(255,255,255,.03)]"
                >
                  <div
                    aria-hidden="true"
                    className="absolute -right-12 -top-12 size-36 rounded-full bg-violet-500/0 blur-3xl transition duration-500 group-hover:bg-violet-500/10"
                  />
                  <span className="grid size-10 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-violet-200">
                    <Icon className="size-5" />
                  </span>
                  <p className="m-0 mt-6 text-[9px] font-semibold uppercase tracking-[0.15em] text-violet-300/55">
                    {item.eyebrow}
                  </p>
                  <h3 className="m-0 mt-2 text-xl font-semibold tracking-[-0.03em] text-white">
                    {item.title}
                  </h3>
                  <p className="m-0 mt-3 text-sm leading-6 text-white/42">
                    {item.body}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
