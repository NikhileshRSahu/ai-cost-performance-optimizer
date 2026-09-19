'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BadgeDollarSign,
  Gauge,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { DashboardDrilldown } from '../workbench/dashboard-drilldown';
import { DashboardWidgetGrid } from '../workbench/dashboard-widget-grid';
import { EvalomicsCopilot } from '../workbench/evalomics-copilot';
import { ResultJourney } from '../workbench/result-journey';

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
          style={{ height: String(Math.max(14, value)) + '%', width: '100%' }}
        />
      ))}
    </div>
  );
}

function DemoEvidenceHeat() {
  return (
    <div
      className="mt-5 grid grid-cols-12 gap-1"
      role="img"
      aria-label="Three of four demo evidence stages active"
    >
      {Array.from({ length: 36 }).map((_, index) => {
        const stage = Math.floor(index / 9);
        return (
          <span
            key={index}
            className={
              stage < 3
                ? index % 7 === 0
                  ? 'h-3 rounded-[3px] bg-sky-300'
                  : 'h-3 rounded-[3px] bg-sky-500/55'
                : 'h-3 rounded-[3px] bg-white/[0.07]'
            }
          />
        );
      })}
    </div>
  );
}

export function PublicDemoDashboard() {
  return (
    <div className="grid gap-5">
      <div className="sticky top-3 z-30 flex flex-col gap-3 rounded-2xl border border-amber-300/15 bg-[#111214]/95 px-4 py-3 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="m-0 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200/80">
            Demo data · synthetic · not customer results
          </p>
          <p className="m-0 mt-1 text-xs text-white/45">
            This uses the same story, cards, drill-downs, and Evalomics AI pattern as the real workspace.
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
          30 days · 22,380 requests · synthetic evidence showing the complete Evalomics decision story.
        </p>
      </section>

      <ResultJourney current="Evaluated" />

      <section className="rounded-[22px] border border-white/[0.08] bg-[#0f1115] p-5">
        <p className="m-0 font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-sky-300/65">
          Outcome summary
        </p>
        <p className="m-0 mt-2 text-sm leading-6 text-white/65">
          $1,774.78 observed spend → 3 supported opportunities → best change:
          cache the stable repeated prompt prefix → estimated $286–$421 → Medium
          confidence → next: stage the evaluated caching change.
        </p>
      </section>

      <DashboardWidgetGrid
        storageKey="evalomics-public-demo-dashboard"
        items={[
          { id: 'recommendation', size: 'wide', label: 'Recommended action' },
          { id: 'evidence', size: 'wide', label: 'Evidence status' },
          { id: 'spend', size: 'sm', label: 'Observed AI spend' },
          { id: 'opportunities', size: 'sm', label: 'Opportunities found' },
          { id: 'estimated', size: 'sm', label: 'Estimated savings' },
          { id: 'evaluation', size: 'sm', label: 'Evaluation status' },
          { id: 'diagnosis', size: 'lg', label: 'Usage diagnosis' },
        ]}
      >
        <DashboardDrilldown
          eyebrow="Recommended action"
          title="Cache the stable repeated prompt prefix"
          summary="Evalomics ranked this as the strongest supported action in the synthetic evidence window."
          items={[
            { label: 'Expected impact', value: '$87.42 sample opportunity' },
            { label: 'Detection confidence', value: 'Medium' },
            { label: 'Evaluation result', value: 'Candidate evaluated' },
            { label: 'Quality floor', value: '0.90 minimum' },
          ]}
          insight="1,248 similar requests repeatedly send a stable prefix that is eligible for a caching strategy."
          nextStep="Stage the caching change for this workload and keep the quality floor unchanged."
        >
          <section className="flex h-full flex-col rounded-[22px] border border-white/[0.10] bg-[#121316] p-5 font-mono sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="m-0 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                  Recommended action
                </p>
                <h2 className="mt-2 text-lg font-medium text-white">
                  Cache the stable repeated prompt prefix
                </h2>
              </div>
              <Sparkles className="size-4 text-emerald-300/70" />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                ['Expected impact', '$87.42'],
                ['Confidence', 'Medium'],
                ['Evaluation', 'Ready candidate'],
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
            <p className="m-0 mt-auto pt-5 text-[11px] leading-5 text-slate-500">
              Evalomics found repeated stable input and checked the candidate against the sample quality floor.
            </p>
          </section>
        </DashboardDrilldown>

        <DashboardDrilldown
          eyebrow="Evidence status"
          title="How far Evalomics has taken this sample result"
          summary="The demo is currently at Evaluated: the opportunity was found and the candidate was checked."
          items={[
            { label: 'Connected', value: '22,380 requests loaded' },
            { label: 'Found', value: '3 opportunities identified' },
            { label: 'Evaluated', value: 'Caching candidate checked' },
            { label: 'Proven', value: 'After rollout' },
          ]}
          insight="The sample candidate is useful before production proof because its evidence and quality guard are already visible."
          nextStep="In a real workspace, Ready follows when the evaluated candidate is prepared for staged implementation."
        >
          <section className="flex h-full flex-col rounded-[22px] border border-white/[0.10] bg-[#121316] p-5 font-mono sm:p-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-violet-300" />
              <h2 className="text-sm font-medium text-slate-100">Evidence status</h2>
            </div>
            <DemoEvidenceHeat />
            <p className="m-0 mt-4 text-xs leading-5 text-slate-500">
              Connected → Found → Evaluated. Ready and Proven come next.
            </p>
          </section>
        </DashboardDrilldown>

        <DashboardDrilldown
          eyebrow="Observed AI spend"
          title="$1,774.78"
          summary="Measured spend reconstructed from the synthetic usage window."
          items={[
            { label: 'Requests', value: '22,380' },
            { label: 'Period', value: '30 days' },
            { label: 'Source', value: 'Synthetic CSV' },
            { label: 'Currency', value: 'USD' },
          ]}
          insight="This baseline anchors all later estimates in the demo."
          nextStep="Compare the baseline against the ranked optimization opportunities."
        >
          <article className="flex h-full flex-col rounded-[22px] border border-white/[0.10] bg-[#121316] p-5 font-mono">
            <div className="flex items-center justify-between">
              <p className="m-0 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                Observed AI spend
              </p>
              <BadgeDollarSign className="size-4 text-sky-300/70" />
            </div>
            <p className="mt-4 text-3xl tracking-[-0.05em] text-white">$1,774.78</p>
            <p className="m-0 mt-1 text-[10px] text-slate-500">measured from sample usage</p>
            <DemoBars values={[42, 53, 47, 58, 63, 55, 71, 66, 74, 69, 83, 88]} />
          </article>
        </DashboardDrilldown>

        <DashboardDrilldown
          eyebrow="Opportunities found"
          title="3 supported opportunities"
          summary="Evalomics ranked three optimization signals in the synthetic evidence."
          items={[
            { label: 'Strongest', value: 'Repeated-input caching' },
            { label: 'Second', value: 'Model right-sizing' },
            { label: 'Third', value: 'Context pruning' },
            { label: 'Top confidence', value: 'Medium' },
          ]}
          insight="Repeated-input caching ranks first because the sample data contains a clear repeated-prefix pattern."
          nextStep="Evaluate the strongest candidate before spending attention on lower-ranked ideas."
        >
          <article className="flex h-full flex-col rounded-[22px] border border-white/[0.10] bg-[#121316] p-5 font-mono">
            <p className="m-0 text-[10px] uppercase tracking-[0.18em] text-slate-400">
              Opportunities found
            </p>
            <p className="mt-4 text-3xl tracking-[-0.05em] text-white">3</p>
            <p className="m-0 mt-1 text-[10px] text-slate-500">ranked by supported evidence</p>
            <DemoBars values={[25, 40, 58, 71, 63, 79, 68, 82]} accent="bg-violet-300" />
          </article>
        </DashboardDrilldown>

        <DashboardDrilldown
          eyebrow="Estimated savings"
          title="$286–$421"
          summary="This is the sample evidence-backed range used to prioritize optimization work."
          items={[
            { label: 'Low', value: '$286' },
            { label: 'Base', value: '$354' },
            { label: 'High', value: '$421' },
            { label: 'Confidence', value: 'Medium' },
          ]}
          insight="The estimate is useful for prioritization now; the final Proven amount comes after rollout."
          nextStep="Use the evaluated candidate and quality guard to decide whether to stage implementation."
        >
          <article className="flex h-full flex-col rounded-[22px] border border-white/[0.10] bg-[#121316] p-5 font-mono">
            <div className="flex items-center justify-between">
              <p className="m-0 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                Estimated savings
              </p>
              <Gauge className="size-4 text-emerald-300/70" />
            </div>
            <p className="mt-4 text-3xl tracking-[-0.05em] text-white">$286–$421</p>
            <p className="m-0 mt-1 text-[10px] text-slate-500">evidence-backed sample estimate</p>
            <DemoBars values={[18, 24, 31, 28, 36, 42, 47, 53, 58, 62, 69, 76]} accent="bg-emerald-400" />
          </article>
        </DashboardDrilldown>

        <DashboardDrilldown
          eyebrow="Evaluation status"
          title="Evaluated"
          summary="The strongest sample candidate has been checked against the sample quality floor."
          items={[
            { label: 'Found', value: 'Yes' },
            { label: 'Evaluated', value: 'Yes' },
            { label: 'Ready', value: 'Next stage' },
            { label: 'Proven', value: 'After rollout' },
          ]}
          insight="The candidate cleared the illustrated quality floor and is ready for implementation planning."
          nextStep="Prepare the staged rollout and preserve the same production measurement basis."
        >
          <article className="flex h-full flex-col rounded-[22px] border border-white/[0.10] bg-[#121316] p-5 font-mono">
            <p className="m-0 text-[10px] uppercase tracking-[0.18em] text-slate-400">
              Evaluation status
            </p>
            <p className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-white">Evaluated</p>
            <p className="m-0 mt-1 text-[10px] text-emerald-300">quality floor passed in sample evidence</p>
          </article>
        </DashboardDrilldown>

        <DashboardDrilldown
          eyebrow="Supporting evidence summary"
          title="Why Evalomics reached this result"
          summary="These synthetic facts support the recommendation without requiring the user to inspect raw rows first."
          items={[
            { label: 'Repeated requests', value: '1,248' },
            { label: 'Quality score', value: '0.91' },
            { label: 'Input + output tokens', value: '20.5M' },
            { label: 'p50 latency', value: '1.37s' },
          ]}
          insight="Repeated stable input is the strongest waste signal in this sample."
          nextStep="Open the recommendation or ask Evalomics AI to explain how the evidence connects to the next action."
        >
          <section className="flex h-full flex-col rounded-[22px] border border-white/[0.10] bg-[#121316] p-5 font-mono sm:p-6">
            <p className="m-0 text-[10px] uppercase tracking-[0.18em] text-slate-400">
              Usage diagnosis
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                ['Repeated requests', '1,248'],
                ['Quality score', '0.91'],
                ['Token usage', '20.5M'],
                ['p50 latency', '1.37s'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-white/[0.07] bg-black/20 p-4">
                  <p className="m-0 text-[9px] uppercase tracking-[0.12em] text-slate-500">{label}</p>
                  <p className="m-0 mt-2 text-sm text-white">{value}</p>
                </div>
              ))}
            </div>
          </section>
        </DashboardDrilldown>
      </DashboardWidgetGrid>

      <EvalomicsCopilot organizationId="public-demo" demo />

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
              Connect OpenAI or Anthropic, or upload a CSV. Evalomics will return to the same story and dashboard with your evidence.
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
