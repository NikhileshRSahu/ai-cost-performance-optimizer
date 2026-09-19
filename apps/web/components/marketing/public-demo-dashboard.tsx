'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BadgeDollarSign,
  Database,
  FlaskConical,
  Gauge,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { DashboardWidgetGrid } from '../workbench/dashboard-widget-grid';

function DemoBars({
  values,
  accent = 'bg-sky-400',
}: Readonly<{ values: readonly number[]; accent?: string }>) {
  return (
    <div className="mt-auto flex h-12 items-end gap-1" aria-hidden="true">
      {values.map((value, index) => (
        <span
          key={index}
          className={index === values.length - 1 ? accent : 'bg-white/[0.16]'}
          style={{ height: `${Math.max(14, value)}%`, width: '100%' }}
        />
      ))}
    </div>
  );
}

function DemoHeatmap() {
  const intensities = [
    1, 1, 1, 2, 2, 2, 3, 2, 1, 1, 2, 2, 1, 1, 2, 2, 3, 3, 4, 3, 2, 2, 2, 1, 1,
    2, 2, 3, 4, 4, 4, 3, 3, 2, 2, 1,
  ];

  return (
    <div
      className="mt-5 grid grid-cols-12 gap-1"
      aria-label="Synthetic activity heatmap"
    >
      {intensities.map((value, index) => (
        <span
          key={index}
          className={
            value === 4
              ? 'h-3 rounded-[3px] bg-sky-300'
              : value === 3
                ? 'h-3 rounded-[3px] bg-sky-500/75'
                : value === 2
                  ? 'h-3 rounded-[3px] bg-sky-500/35'
                  : 'h-3 rounded-[3px] bg-white/[0.07]'
          }
        />
      ))}
    </div>
  );
}

const traceRows = [
  ['req_8f21b', 'support_answer', '820ms'],
  ['req_144ac', 'code_review', '1.42s'],
  ['req_5ca90', 'search_agent', '2.18s'],
  ['req_9d7e1', 'report_generation', '1.06s'],
] as const;

export function PublicDemoDashboard() {
  return (
    <div className="grid gap-5">
      <div className="sticky top-3 z-30 flex flex-col gap-3 rounded-2xl border border-amber-300/15 bg-[#111214]/95 px-4 py-3 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="m-0 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200/80">
            Demo data · synthetic · not customer results
          </p>
          <p className="m-0 mt-1 text-xs text-white/45">
            Explore the same dashboard structure before connecting your own
            usage.
          </p>
        </div>
        <Link
          href="/start?intent=analyze"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-slate-950 no-underline"
        >
          Use my own data <ArrowRight className="size-3.5" />
        </Link>
      </div>

      <section className="border-b border-white/[0.06] pb-5">
        <p className="m-0 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300/70">
          Sample AI Efficiency MRI
        </p>
        <h1 className="mt-3 font-mono text-2xl font-medium tracking-[-0.04em] text-white sm:text-3xl">
          We analyzed this sample company&apos;s AI usage
        </h1>
        <p className="mt-2 max-w-3xl font-mono text-xs leading-5 text-slate-500">
          30 days · 22,380 requests · synthetic evidence designed to show how
          Evalomics separates observed spend, opportunities, testing, and
          verification.
        </p>
      </section>

      <DashboardWidgetGrid
        storageKey="evalomics-public-demo-dashboard"
        items={[
          { id: 'traces', size: 'wide', label: 'Recent traces' },
          { id: 'activity', size: 'wide', label: 'Usage activity' },
          { id: 'spend', size: 'sm', label: 'Observed spend' },
          { id: 'opportunity', size: 'sm', label: 'Modeled upside' },
          { id: 'quality', size: 'sm', label: 'Quality score' },
          { id: 'verified', size: 'sm', label: 'Verified savings' },
          { id: 'recommendation', size: 'wide', label: 'Recommended action' },
          { id: 'models', size: 'wide', label: 'Model usage' },
        ]}
      >
        <section className="flex h-full flex-col rounded-[22px] border border-white/[0.10] bg-[#121316] p-5 font-mono">
          <div className="flex items-center justify-between gap-3">
            <p className="m-0 text-[10px] uppercase tracking-[0.18em] text-slate-400">
              Recent traces
            </p>
            <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-300">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              live sample
            </span>
          </div>
          <p className="mt-3 text-3xl tracking-[-0.05em] text-white">1.37s</p>
          <p className="m-0 text-[10px] text-slate-500">p50 latency</p>
          <div className="mt-6 grid gap-3">
            {traceRows.map(([id, workflow, latency], index) => (
              <div
                key={id}
                className="grid grid-cols-[1fr_1.4fr_auto] items-center gap-3 text-[11px]"
              >
                <span className="text-white/80">
                  <i className="mr-2 inline-block size-1.5 rounded-full bg-emerald-400" />
                  {id}
                </span>
                <span className="text-slate-400">{workflow}</span>
                <span
                  className={index === 2 ? 'text-amber-200' : 'text-slate-300'}
                >
                  {latency}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="flex h-full flex-col rounded-[22px] border border-white/[0.10] bg-[#121316] p-5 font-mono">
          <div className="flex items-center justify-between gap-3">
            <p className="m-0 text-[10px] uppercase tracking-[0.18em] text-slate-400">
              Usage activity
            </p>
            <span className="text-[10px] text-emerald-300">
              ↑ 12% vs prior week
            </span>
          </div>
          <p className="mt-3 text-3xl tracking-[-0.05em] text-white">22,380</p>
          <p className="m-0 text-[10px] text-slate-500">
            requests · last 30 days
          </p>
          <DemoHeatmap />
          <div className="mt-3 flex justify-between text-[9px] text-slate-600">
            <span>week 1</span>
            <span>week 2</span>
            <span>week 3</span>
            <span>week 4</span>
          </div>
        </section>

        <article className="flex h-full flex-col rounded-[22px] border border-white/[0.10] bg-[#121316] p-5 font-mono">
          <div className="flex items-center justify-between">
            <p className="m-0 text-[10px] uppercase tracking-[0.18em] text-slate-400">
              Observed spend
            </p>
            <BadgeDollarSign className="size-4 text-sky-300/70" />
          </div>
          <p className="mt-4 text-3xl tracking-[-0.05em] text-white">
            $1,774.78
          </p>
          <p className="m-0 mt-1 text-[10px] text-slate-500">
            measured from sample usage
          </p>
          <DemoBars values={[42, 53, 47, 58, 63, 55, 71, 66, 74, 69, 83, 88]} />
        </article>

        <article className="flex h-full flex-col rounded-[22px] border border-white/[0.10] bg-[#121316] p-5 font-mono">
          <div className="flex items-center justify-between">
            <p className="m-0 text-[10px] uppercase tracking-[0.18em] text-slate-400">
              Modeled upside
            </p>
            <Gauge className="size-4 text-emerald-300/70" />
          </div>
          <p className="mt-4 text-3xl tracking-[-0.05em] text-white">
            $286–$421
          </p>
          <p className="m-0 mt-1 text-[10px] text-slate-500">
            potential · not verified savings
          </p>
          <DemoBars
            values={[18, 24, 31, 28, 36, 42, 47, 53, 58, 62, 69, 76]}
            accent="bg-emerald-400"
          />
        </article>

        <article className="flex h-full flex-col rounded-[22px] border border-white/[0.10] bg-[#121316] p-5 font-mono">
          <div className="flex items-center justify-between">
            <p className="m-0 text-[10px] uppercase tracking-[0.18em] text-slate-400">
              Quality score
            </p>
            <ShieldCheck className="size-4 text-cyan-300/70" />
          </div>
          <p className="mt-4 text-3xl tracking-[-0.05em] text-white">0.91</p>
          <p className="m-0 mt-1 text-[10px] text-emerald-300">
            ↑ 0.03 sample benchmark
          </p>
          <div className="mt-auto grid gap-2 text-[10px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Faithfulness</span>
              <span>0.94</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Relevancy</span>
              <span>0.89</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Correctness</span>
              <span>0.91</span>
            </div>
          </div>
        </article>

        <article className="flex h-full flex-col rounded-[22px] border border-white/[0.10] bg-[#121316] p-5 font-mono">
          <div className="flex items-center justify-between">
            <p className="m-0 text-[10px] uppercase tracking-[0.18em] text-slate-400">
              Verified savings
            </p>
            <FlaskConical className="size-4 text-violet-300/70" />
          </div>
          <p className="mt-4 text-3xl tracking-[-0.05em] text-white">$0.00</p>
          <p className="m-0 mt-1 text-[10px] text-slate-500">
            not yet production-verified
          </p>
          <div className="mt-auto rounded-lg border border-violet-300/10 bg-violet-300/[0.035] p-3 text-[10px] leading-5 text-violet-100/65">
            Evalomics does not convert modeled upside into verified savings
            without post-change evidence.
          </div>
        </article>

        <section className="flex h-full flex-col rounded-[22px] border border-white/[0.10] bg-[#121316] p-5 font-mono">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="m-0 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                Recommended action
              </p>
              <h2 className="mt-2 text-lg font-medium text-white">
                Benchmark repeated input against your quality floor
              </h2>
            </div>
            <Sparkles className="size-4 text-emerald-300/70" />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              ['Repeated input', '1,248 similar requests'],
              ['Modeled opportunity', '$87.42'],
              ['Confidence', 'Medium'],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-lg border border-white/[0.07] bg-black/20 p-4"
              >
                <p className="m-0 text-[9px] uppercase tracking-[0.12em] text-slate-500">
                  {label}
                </p>
                <p className="m-0 mt-2 text-sm text-white">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-auto pt-5">
            <p className="m-0 text-[11px] leading-5 text-slate-500">
              Sample logic: repeated stable input suggests a caching experiment,
              but the cheaper path still needs benchmark evidence before any
              production claim.
            </p>
          </div>
        </section>

        <section className="flex h-full flex-col rounded-[22px] border border-white/[0.10] bg-[#121316] p-5 font-mono">
          <div className="flex items-center justify-between gap-3">
            <p className="m-0 text-[10px] uppercase tracking-[0.18em] text-slate-400">
              Token usage by model
            </p>
            <Database className="size-4 text-sky-300/60" />
          </div>
          <p className="mt-3 text-3xl tracking-[-0.05em] text-white">20.5M</p>
          <p className="m-0 text-[10px] text-slate-500">
            input + output tokens
          </p>
          <div className="mt-6 grid gap-3">
            {[
              ['gpt-4o', '42%', 'w-[42%]', 'bg-sky-400'],
              ['claude-sonnet-4-5', '27%', 'w-[27%]', 'bg-cyan-300'],
              ['gpt-4o-mini', '18%', 'w-[18%]', 'bg-violet-300'],
              ['claude-haiku-4-5', '13%', 'w-[13%]', 'bg-white/30'],
            ].map(([model, share, width, tone]) => (
              <div
                key={model}
                className="grid grid-cols-[1fr_1.4fr_auto] items-center gap-3 text-[10px]"
              >
                <span className="text-slate-300">{model}</span>
                <span className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <i className={`block h-full rounded-full ${width} ${tone}`} />
                </span>
                <span className="text-slate-400">{share}</span>
              </div>
            ))}
          </div>
        </section>
      </DashboardWidgetGrid>

      <section className="rounded-[22px] border border-white/[0.08] bg-[#101114] p-5 sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="m-0 font-mono text-[10px] uppercase tracking-[0.16em] text-emerald-300/70">
              Ready for your own evidence?
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
              The next dashboard can use your real usage.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">
              Connect OpenAI or Anthropic, or upload a CSV. Evalomics will
              return to the same dashboard structure with your observed
              evidence.
            </p>
          </div>
          <Link
            href="/start?intent=analyze"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 no-underline"
          >
            Analyze my usage <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
