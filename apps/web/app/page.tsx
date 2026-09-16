import Link from 'next/link';
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { ContainerScroll } from '../components/ui/container-scroll-animation';

const steps = [
  ['01', 'Observe', 'Load one real usage window.'],
  ['02', 'Diagnose', 'Rank waste by evidence, value, and risk.'],
  ['03', 'Test', 'Challenge one change against the quality floor.'],
  ['04', 'Verify', 'Count savings only after production evidence agrees.'],
] as const;

export default function HomePage() {
  return (
    <div className="grid gap-20 pb-10 md:gap-28">
      <section className="rounded-[30px] border border-slate-800 bg-[#070a0f] px-6 py-16 text-white shadow-[0_40px_120px_rgba(2,6,23,.18)] sm:px-10 sm:py-20 lg:px-12 lg:py-24">
        <div className="max-w-3xl">
          <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/70">
            AI Efficiency Intelligence
          </p>
          <h1 className="mt-5 text-[clamp(3.5rem,8vw,7.5rem)] font-semibold leading-[.88] tracking-[-.075em] text-white">
            Find AI waste.
            <span className="block text-white/68">Prove the fix.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
            Evalomics turns real usage evidence into one ranked optimization,
            tests it against your quality floor, and verifies what actually
            improved.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 no-underline transition hover:bg-emerald-100"
              style={{ color: '#0b1017' }}
            >
              Run the Work MRI <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/tools/llm-cost-calculator"
              className="inline-flex min-h-12 items-center rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white no-underline transition hover:bg-white/[0.08]"
              style={{ color: '#ffffff' }}
            >
              Free cost calculator
            </Link>
          </div>
          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-white/55">
            <span>CSV-first</span>
            <span>No prompt content required</span>
            <span>No invented savings</span>
          </div>
        </div>
      </section>

      <ContainerScroll
        titleComponent={
          <div>
            <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Scroll through the proof loop
            </p>
            <h2 className="mt-4 text-[clamp(2.5rem,5vw,5rem)] font-semibold leading-[.94] tracking-[-.06em] text-slate-950">
              The interface becomes the evidence.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-500">
              Watch the Work MRI move from observed spend to one ranked change
              and a verification-ready decision surface.
            </p>
          </div>
        }
      >
        <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#0b1119] shadow-[0_30px_90px_rgba(0,0,0,.35)]">
          <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
            <div>
              <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
                Work MRI
              </p>
              <p className="m-0 mt-1 text-sm font-semibold text-white/85">
                Illustrative workload
              </p>
            </div>
            <span className="rounded-full border border-emerald-300/20 bg-emerald-300/[0.07] px-3 py-1 text-[10px] font-semibold text-emerald-200">
              Synthetic example
            </span>
          </div>

          <div className="border-b border-white/[0.07] px-5 py-3 text-[10px] leading-5 text-white/35">
            Illustrative product walkthrough only. These numbers are synthetic
            and are not a customer result.
          </div>

          <div className="grid gap-2.5 p-4 sm:grid-cols-3 sm:p-5">
            {[
              ['Observed spend', '$18,420', 'Example evidence'],
              ['Potential', '$4,870', 'Not achieved'],
              ['Verified', '$1,742', 'Example post-change proof'],
            ].map(([label, value, detail]) => (
              <div
                key={label}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4"
              >
                <p className="m-0 text-[9px] font-semibold uppercase tracking-[0.13em] text-white/30">
                  {label}
                </p>
                <p className="m-0 mt-3 font-mono text-2xl font-medium tracking-[-0.04em] text-white">
                  {value}
                </p>
                <p className="m-0 mt-1 text-[10px] text-white/28">{detail}</p>
              </div>
            ))}
          </div>

          <div className="mx-4 mb-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 sm:mx-5 sm:mb-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-200/55">
                  Rank #1
                </p>
                <h2 className="m-0 mt-2 text-lg font-semibold tracking-[-0.025em] text-white/90">
                  Route low-complexity classification to a cheaper model
                </h2>
              </div>
              <span className="shrink-0 rounded-full border border-amber-300/20 bg-amber-300/[0.07] px-3 py-1 text-[10px] font-semibold text-amber-100">
                Potential
              </span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                ['Quality floor', '0.90'],
                ['Candidate', '0.93'],
                ['Projected saving', '$2,190/mo'],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="m-0 text-[9px] uppercase tracking-[0.12em] text-white/25">
                    {label}
                  </p>
                  <p className="m-0 mt-1 font-mono text-sm font-semibold text-white/75">
                    {value}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-center gap-2 border-t border-white/[0.07] pt-4 text-[11px] font-semibold text-emerald-200/70">
              <CheckCircle2 className="size-4" />
              Next action: benchmark this candidate
            </div>
          </div>
        </div>
      </ContainerScroll>

      <section className="grid gap-10 lg:grid-cols-[.76fr_1.24fr] lg:items-start">
        <div className="max-w-xl">
          <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            One operating loop
          </p>
          <h2 className="mt-4 max-w-[11ch] text-[clamp(2.7rem,5vw,5rem)] font-semibold leading-[.94] tracking-[-.06em] text-slate-950">
            From spend to a decision you can defend.
          </h2>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-500">
            No generic optimization feed. Evalomics advances one claim through
            evidence, testing, implementation, and proof.
          </p>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,.055)]">
          {steps.map(([index, title, body]) => (
            <div
              key={title}
              className="grid gap-3 border-b border-slate-100 p-5 last:border-0 sm:grid-cols-[52px_120px_1fr] sm:items-center sm:p-6"
            >
              <span className="font-mono text-[11px] font-semibold text-slate-400">
                {index}
              </span>
              <strong className="text-sm font-semibold text-slate-950">
                {title}
              </strong>
              <span className="text-sm leading-6 text-slate-500">{body}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-8 rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_24px_70px_rgba(15,23,42,.05)] sm:p-10 lg:grid-cols-[1fr_.9fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
            <ShieldCheck className="size-3.5" />
            Product contract
          </div>
          <h2 className="mt-4 max-w-[11ch] text-[clamp(2.4rem,5vw,4.4rem)] font-semibold leading-[.95] tracking-[-.055em] text-slate-950">
            No evidence, no claim.
          </h2>
        </div>
        <div>
          <p className="m-0 text-sm leading-6 text-slate-500">
            Potential, Tested, and Verified remain separate states. Savings only
            become Verified after comparable post-change production evidence
            confirms the impact.
          </p>
          <Link
            href="/methodology"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-950 no-underline"
          >
            Read the methodology <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
