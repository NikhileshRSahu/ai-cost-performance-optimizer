import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  ChartNoAxesCombined,
  CircleDollarSign,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import Velaris from "@/components/ui/velaris";

const findings = [
  {
    name: "Repeated context",
    value: "$1,420/mo",
    confidence: "High confidence",
    signal: "Prompt overlap",
  },
  {
    name: "Model overqualification",
    value: "$2,190/mo",
    confidence: "Benchmark next",
    signal: "Quality headroom",
  },
  {
    name: "Cache miss pattern",
    value: "$1,260/mo",
    confidence: "High confidence",
    signal: "Reusable prefix",
  },
] as const;

function ProductSurface() {
  return (
    <div className="h-full w-full overflow-hidden rounded-xl border border-white/10 bg-[#080b0f] text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <div className="grid size-8 place-items-center rounded-lg bg-emerald-400/15 text-emerald-300">
            <BrainCircuit className="size-4" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
              Work MRI
            </p>
            <p className="text-sm font-semibold text-white/90">Production workload</p>
          </div>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-medium text-emerald-200 sm:flex">
          <span className="size-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,.8)]" />
          Evidence loaded
        </div>
      </div>

      <div className="grid gap-3 p-4 md:grid-cols-3 md:p-6">
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <p className="text-xs font-medium text-white/45">Observed spend</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">$18,420</p>
          <p className="mt-1 text-xs text-white/35">monthly evidence window</p>
        </div>
        <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.06] p-4">
          <p className="text-xs font-medium text-amber-100/55">Potential waste</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-amber-100 md:text-3xl">
            $4,870
          </p>
          <p className="mt-1 text-xs text-amber-100/35">not yet claimed as savings</p>
        </div>
        <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.06] p-4">
          <p className="text-xs font-medium text-emerald-100/55">Verified net saving</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-emerald-100 md:text-3xl">
            $1,742
          </p>
          <p className="mt-1 text-xs text-emerald-100/35">quality floor passed</p>
        </div>
      </div>

      <div className="grid gap-3 px-4 md:grid-cols-[1.35fr_.65fr] md:px-6">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Ranked opportunities</p>
              <p className="text-xs text-white/40">Evidence strength × expected value × risk</p>
            </div>
            <Sparkles className="size-4 text-emerald-300/70" />
          </div>
          <div>
            {findings.map((finding, index) => (
              <div
                key={finding.name}
                className="grid grid-cols-[28px_1fr_auto] items-center gap-3 border-b border-white/[0.07] px-4 py-3 last:border-0"
              >
                <span className="font-mono text-[11px] text-blue-300/75">0{index + 1}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white/90">{finding.name}</p>
                  <p className="truncate text-xs text-white/35">
                    {finding.signal} · {finding.confidence}
                  </p>
                </div>
                <p className="text-sm font-semibold text-white/85">{finding.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.045] to-transparent p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/35">
            Proof state
          </p>
          <div className="mt-5 grid gap-3">
            {[
              ["Opportunity", "Evidence supports testing", true],
              ["Tested", "Benchmark cleared guardrail", true],
              ["Verified", "Post-change proof recorded", true],
            ].map(([label, note, complete]) => (
              <div key={String(label)} className="flex items-start gap-3">
                <div
                  className={
                    complete
                      ? "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-emerald-300/25 bg-emerald-300/10 text-emerald-200"
                      : "mt-0.5 size-6 shrink-0 rounded-full border border-white/10"
                  }
                >
                  <BadgeCheck className="size-3.5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/90">{label}</p>
                  <p className="text-xs leading-5 text-white/35">{note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-4 mt-3 flex items-center justify-between rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.06] px-4 py-3 md:mx-6 md:mt-4">
        <div>
          <p className="text-xs text-emerald-100/45">Selected recommendation</p>
          <p className="mt-1 text-sm font-semibold text-emerald-50">
            Route low-complexity classification to a cheaper candidate model.
          </p>
        </div>
        <div className="hidden rounded-full border border-emerald-300/20 px-3 py-1 text-xs font-medium text-emerald-100/80 md:block">
          Ready to benchmark
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="landing-stack !gap-0">
      <Velaris
        height="min(760px, calc(100vh - 96px))"
        className="rounded-[28px] border border-white/10 shadow-[0_30px_90px_rgba(6,12,18,.28)]"
        bg="#030506"
        colors={["#1d4ed8", "#10b981", "#065f46", "#020617"]}
        speed={1.35}
        grain={0.18}
      >
        <section
          className="relative flex h-full items-center px-6 py-16 sm:px-10 lg:px-16"
          aria-labelledby="page-title"
        >
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,.82)_0%,rgba(2,6,23,.55)_48%,rgba(2,6,23,.2)_100%)]" />
          <div className="relative z-10 max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-xs font-medium text-white/70 backdrop-blur-xl">
              <span className="size-1.5 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,.9)]" />
              Evalomics · AI Efficiency Intelligence
            </div>
            <h1
              id="page-title"
              className="max-w-4xl !text-[clamp(3rem,8vw,7.4rem)] !leading-[.88] !tracking-[-.07em] text-white"
            >
              Find AI waste.
              <span className="mt-2 block bg-gradient-to-r from-emerald-200 via-white to-blue-200 bg-clip-text text-transparent">
                Prove the fix.
              </span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-7 text-white/62 sm:text-lg">
              Evalomics turns usage evidence into a Work MRI: detect waste, rank the safest
              optimization, benchmark it against your quality floor, and verify what actually
              improved.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="group inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 no-underline transition hover:-translate-y-0.5 hover:bg-emerald-100"
              >
                Run the free Work MRI
                <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/methodology"
                className="inline-flex min-h-12 items-center rounded-xl border border-white/15 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-white no-underline backdrop-blur-xl transition hover:bg-white/[0.1]"
              >
                Inspect the methodology
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-white/45">
              <span>✓ CSV-first</span>
              <span>✓ No prompt content required</span>
              <span>✓ Potential ≠ verified</span>
            </div>
          </div>
        </section>
      </Velaris>

      <section className="mt-8 grid grid-cols-2 overflow-hidden rounded-2xl border border-slate-200 bg-white md:grid-cols-4">
        {[
          ["01", "Observe", "Usage evidence"],
          ["02", "Diagnose", "Waste map"],
          ["03", "Benchmark", "Quality guard"],
          ["04", "Verify", "Net savings"],
        ].map(([index, title, note], position) => (
          <article
            key={title}
            className={
              "p-5 md:p-6 " +
              (position < 3 ? "md:border-r md:border-slate-200 " : "") +
              (position < 2 ? "border-b border-slate-200 md:border-b-0 " : "")
            }
          >
            <p className="font-mono text-xs font-semibold text-blue-600">{index}</p>
            <p className="mt-3 text-base font-semibold text-slate-950">{title}</p>
            <p className="mt-1 text-sm text-slate-500">{note}</p>
          </article>
        ))}
      </section>

      <section className="-mx-2 md:-mx-6">
        <ContainerScroll
          titleComponent={
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                The interface is the explanation
              </p>
              <h2 className="mx-auto max-w-4xl !text-[clamp(2.6rem,6vw,5.8rem)] !leading-[.95] !tracking-[-.06em] text-slate-950">
                From raw AI spend to a decision you can defend.
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-500">
                Every recommendation carries evidence, a test state, a quality guard, and a
                verification boundary.
              </p>
            </div>
          }
        >
          <ProductSurface />
        </ContainerScroll>
      </section>

      <section className="grid gap-6 py-20 md:grid-cols-[.85fr_1.15fr] md:py-28">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Not another cost dashboard
          </p>
          <h2 className="mt-4 !text-[clamp(2.4rem,5vw,4.7rem)] !leading-[.98] !tracking-[-.055em] text-slate-950">
            A decision system for AI efficiency.
          </h2>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-500">
            Dashboards tell you what happened. Evalomics is designed to tell you what is worth
            changing, what must be tested first, and whether the change actually improved unit
            economics.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            [CircleDollarSign, "Waste map", "Locate spend, token, retry, cache, and repeated-context inefficiency."],
            [ChartNoAxesCombined, "Ranked next action", "Prioritize bounded hypotheses by evidence strength, expected value, and risk."],
            [ShieldCheck, "Quality guard", "Require an explicit performance floor before implementation is recommended."],
            [BadgeCheck, "Proof state", "Keep Opportunity, Tested, and Verified states visibly separate."],
          ].map(([Icon, title, description]) => {
            const FeatureIcon = Icon;
            return (
              <article
                key={String(title)}
                className="group min-h-56 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_16px_45px_rgba(15,23,42,.05)] transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_20px_55px_rgba(15,23,42,.08)]"
              >
                <div className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
                  <FeatureIcon className="size-5" />
                </div>
                <h3 className="mt-12 text-lg font-semibold tracking-tight text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mb-16 overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950 px-6 py-14 text-white sm:px-10 md:px-14 md:py-16">
        <div className="grid gap-10 md:grid-cols-[.8fr_1.2fr] md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/75">
              Evidence before claims
            </p>
            <h2 className="mt-4 !text-[clamp(2.3rem,5vw,4.6rem)] !leading-[.98] !tracking-[-.055em] text-white">
              Every number has a state.
            </h2>
          </div>
          <div className="grid gap-3">
            {[
              ["Potential", "A mathematically supported opportunity, not a saving."],
              ["Tested", "A controlled benchmark passed the configured quality floor."],
              ["Verified", "Post-change evidence confirms the net improvement."],
            ].map(([state, description]) => (
              <div
                key={state}
                className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.045] p-4 sm:grid-cols-[100px_1fr] sm:items-center"
              >
                <span className="w-fit rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/80">
                  {state}
                </span>
                <p className="m-0 text-sm leading-6 text-white/45">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
