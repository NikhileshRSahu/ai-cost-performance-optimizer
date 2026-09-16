import Link from 'next/link';
import { ArrowRight, Check, FlaskConical, ShieldCheck } from 'lucide-react';

const freeFeatures = [
  'All public calculators',
  'CSV Work MRI',
  'Evidence-bounded waste diagnosis',
  'Potential / Tested / Verified kept separate',
] as const;

const pilotFeatures = [
  'One production workload',
  'One prioritized optimization hypothesis',
  'Explicit quality floor and benchmark',
  'Decision-ready evidence report',
] as const;

export default function PricingPage() {
  return (
    <div className="grid gap-16 pb-12">
      <section className="max-w-4xl pt-6 sm:pt-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
          Public beta pricing
        </p>
        <h1 className="mt-4 !text-[clamp(3.2rem,7vw,6.8rem)] !leading-[.9] !tracking-[-.07em] text-slate-950">
          Start free.
          <span className="block text-slate-400">
            Pay only when you want a tested decision.
          </span>
        </h1>
        <p className="mt-7 max-w-2xl text-base leading-7 text-slate-500">
          Evalomics is still in public beta. There is no monthly SaaS
          subscription yet. The product is free to explore; the only paid offer
          today is a bounded founding optimization audit.
        </p>
      </section>

      <section
        className="grid gap-4 lg:grid-cols-2"
        aria-label="Current pricing"
      >
        <article className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,.055)] sm:p-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-700">
                Product beta
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-slate-950">
                Free
              </h2>
            </div>
            <div className="text-right">
              <strong className="font-mono text-4xl font-medium tracking-[-0.05em] text-slate-950">
                $0
              </strong>
              <p className="m-0 mt-1 text-xs text-slate-400">
                during public beta
              </p>
            </div>
          </div>

          <p className="mt-6 text-sm leading-6 text-slate-500">
            Use the calculators and run a CSV-first Work MRI without buying a
            subscription.
          </p>

          <ul className="mt-6 grid gap-3 p-0">
            {freeFeatures.map((feature) => (
              <li
                key={feature}
                className="flex list-none items-start gap-2.5 text-sm text-slate-700"
              >
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                {feature}
              </li>
            ))}
          </ul>

          <Link
            href="/login"
            className="mt-8 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white no-underline transition hover:bg-slate-800"
          >
            Run the free Work MRI <ArrowRight className="size-4" />
          </Link>
        </article>

        <article className="relative overflow-hidden rounded-[24px] border border-emerald-300/30 bg-slate-950 p-6 text-white shadow-[0_28px_80px_rgba(15,23,42,.16)] sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(16,185,129,.13),transparent_38%)]" />
          <div className="relative">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300/70">
                  Founding optimization audit
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-white">
                  Tested decision
                </h2>
              </div>
              <div className="text-right">
                <strong className="font-mono text-4xl font-medium tracking-[-0.05em] text-white">
                  $299
                </strong>
                <p className="m-0 mt-1 text-xs text-white/38">one time</p>
              </div>
            </div>

            <p className="mt-6 text-sm leading-6 text-white/55">
              For teams that want us to take one real workload from evidence to
              a controlled benchmark and a defensible go / no-go decision.
            </p>

            <ul className="mt-6 grid gap-3 p-0">
              {pilotFeatures.map((feature) => (
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
              href="/login"
              className="mt-8 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 no-underline transition hover:bg-emerald-100"
            >
              Start with your evidence <ArrowRight className="size-4" />
            </Link>
          </div>
        </article>
      </section>

      <section className="grid gap-4 rounded-[24px] border border-slate-200 bg-slate-50 p-6 sm:p-8 lg:grid-cols-[.9fr_1.1fr]">
        <div>
          <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
            What is not being sold yet
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-slate-950">
            No fake “Pro” tier.
          </h2>
        </div>
        <div className="grid gap-3">
          <div className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <FlaskConical className="mt-0.5 size-4 shrink-0 text-slate-500" />
            <p className="m-0 text-sm leading-6 text-slate-600">
              Continuous optimization, connected workspace intelligence, and
              always-on verification are roadmap capabilities, not paid plans
              today.
            </p>
          </div>
          <div className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-slate-500" />
            <p className="m-0 text-sm leading-6 text-slate-600">
              A larger implementation sprint is scoped only after a tested audit
              produces a real change worth implementing. It is not advertised as
              a fixed product tier.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
