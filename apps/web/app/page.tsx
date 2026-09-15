import Link from 'next/link';
import { ArrowRight, Check, ShieldCheck } from 'lucide-react';
import { EfficiencyStory } from '../components/home/efficiency-story';
import { EvidenceBoundary } from '../components/home/evidence-boundary';
import { WorkMriHero } from '../components/home/work-mri-hero';

export default function HomePage() {
  return (
    <div>
      <WorkMriHero />

      <section className="py-20 md:py-28">
        <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:items-end lg:gap-16">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">
              Not another spend dashboard
            </p>
            <h2 className="mt-4 !text-[clamp(2.8rem,5.4vw,5.6rem)] !leading-[.94] !tracking-[-.065em] text-slate-950">
              The product should make the next decision obvious.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ['01', 'Find the waste', 'Use evidence, not generic advice.'],
              [
                '02',
                'Test the fix',
                'Hold quality constant while economics change.',
              ],
              [
                '03',
                'Prove the result',
                'Verified appears only after production evidence.',
              ],
            ].map(([index, title, body]) => (
              <div key={title} className="border-t border-slate-300 pt-4">
                <span className="font-mono text-[10px] font-semibold text-blue-600">
                  {index}
                </span>
                <h3 className="mt-5 text-base font-semibold tracking-[-0.02em] text-slate-950">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <EfficiencyStory />

      <EvidenceBoundary />

      <section className="mb-12 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,.06)]">
        <div className="grid lg:grid-cols-[1.08fr_.92fr]">
          <div className="p-7 sm:p-10 lg:p-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Start with evidence you already own
            </p>
            <h2 className="mt-4 max-w-3xl !text-[clamp(2.7rem,5vw,5.2rem)] !leading-[.94] !tracking-[-.065em] text-slate-950">
              Give Evalomics one real workload.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-500">
              Begin with a CSV or supported provider evidence. You do not need
              to hand over prompt content just to see whether your workload has
              measurable waste.
            </p>

            <div className="mt-7 grid gap-2.5 sm:grid-cols-2">
              {[
                'CSV-first onboarding',
                'OpenAI / Anthropic usage evidence',
                'No invented savings',
                'Explicit quality floor',
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 text-sm text-slate-600"
                >
                  <span className="grid size-5 place-items-center rounded-full bg-emerald-50 text-emerald-700">
                    <Check className="size-3" />
                  </span>
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white no-underline transition hover:-translate-y-0.5 hover:bg-slate-800"
                href="/login"
              >
                Run the free Work MRI <ArrowRight className="size-4" />
              </Link>
              <Link
                className="inline-flex min-h-12 items-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 no-underline transition hover:bg-slate-50"
                href="/pricing"
              >
                See beta pricing
              </Link>
            </div>
          </div>

          <div className="relative grid content-center gap-4 border-t border-slate-200 bg-[#071019] p-7 text-white sm:p-10 lg:border-l lg:border-t-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,rgba(16,185,129,.12),transparent_36%),radial-gradient(circle_at_25%_90%,rgba(59,130,246,.11),transparent_42%)]" />
            <div className="relative">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200/55">
                <ShieldCheck className="size-3.5" />
                Trust contract
              </div>
              <p className="mt-5 max-w-lg text-2xl font-semibold leading-8 tracking-[-0.035em] text-white/90">
                If the evidence cannot support the claim, the interface should
                say “insufficient evidence” instead of inventing confidence.
              </p>
              <div className="mt-8 grid gap-2">
                {[
                  ['Potential', 'Worth testing, not yet a saving'],
                  ['Tested', 'Controlled benchmark cleared the guardrail'],
                  [
                    'Verified',
                    'Post-change production evidence confirmed impact',
                  ],
                ].map(([state, meaning]) => (
                  <div
                    key={state}
                    className="grid gap-1 rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 py-3 sm:grid-cols-[90px_1fr] sm:items-center"
                  >
                    <strong className="text-xs font-semibold text-white/80">
                      {state}
                    </strong>
                    <span className="text-xs leading-5 text-white/40">
                      {meaning}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
