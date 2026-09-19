import Link from 'next/link';
import { ArrowRight, Check, ShieldCheck } from 'lucide-react';

const freeFeatures = [
  'All public calculators',
  'CSV Work MRI',
  'Evidence-bounded waste diagnosis',
  'Ranked optimization recommendation',
  'Benchmark and quality-floor workflow',
  'Implementation tracking',
  'Post-change verification',
  'Workspace members and invite links',
  'Data export and lifecycle controls',
  'Support during public beta',
] as const;

export default function PricingPage() {
  return (
    <div className="eval-glass-panel relative grid gap-14 overflow-hidden rounded-[28px] p-6 pb-12 text-white sm:p-8">
      <section className="max-w-4xl pt-6 sm:pt-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/75">
          Launch beta
        </p>
        <h1 className="mt-4 !text-[clamp(3.2rem,7vw,6.8rem)] !leading-[.9] !tracking-[-.07em] text-white">
          Launch beta is $0.
          <span className="block text-white/45">Use real data. No card.</span>
        </h1>
        <p className="mt-7 max-w-2xl text-base leading-7 text-white/45">
          During the Evalomics launch beta, the core analysis and verification
          workflow is available for $0. Create a workspace, connect supported
          provider usage or upload a CSV, diagnose supported inefficiency, test
          a candidate, and verify post-change impact without entering payment
          details.
        </p>
      </section>

      <section
        className="eval-glass-card max-w-3xl rounded-[28px] p-6 text-white sm:p-9"
        aria-label="Launch beta pricing"
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300/70">
              Evalomics launch beta
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">
              Core beta workflow
            </h2>
          </div>
          <div className="sm:text-right">
            <strong className="font-mono text-5xl font-medium tracking-[-0.06em] text-white">
              $0
            </strong>
            <p className="m-0 mt-1 text-xs text-white/65">no credit card</p>
          </div>
        </div>

        <ul className="mt-8 grid gap-3 sm:grid-cols-2 p-0">
          {freeFeatures.map((feature) => (
            <li
              key={feature}
              className="flex list-none items-start gap-2.5 text-sm text-white/75"
            >
              <Check className="mt-0.5 size-4 shrink-0 text-emerald-300" />
              {feature}
            </li>
          ))}
        </ul>

        <Link
          href="/start?intent=start"
          className="mt-8 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-white no-underline transition hover:bg-emerald-100"
          style={{ color: '#0b1017' }}
        >
          Start free with your data <ArrowRight className="size-4" />
        </Link>

        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.035] p-4 text-xs leading-5 text-white/75">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-200/70" />
          Evalomics does not require prompt content for the CSV workflow, and
          Potential, Tested, and Verified savings remain separate evidence
          states.
        </div>
      </section>

      <section className="eval-glass-card max-w-3xl rounded-[24px] p-6 sm:p-8">
        <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/45">
          Why free right now
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-white">
          We want product evidence before pricing.
        </h2>
        <p className="mt-3 text-sm leading-6 text-white/45">
          The current goal is to learn which workloads Evalomics helps most and
          make the end-to-end workflow dependable. Paid plans may be introduced
          later with clear notice; using the launch beta does not require a
          subscription.
        </p>
      </section>
    </div>
  );
}
