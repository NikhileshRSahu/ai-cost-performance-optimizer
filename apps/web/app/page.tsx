import Link from 'next/link';
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { EvidenceEngineDemo } from '../components/marketing/evidence-engine-demo';

export default function HomePage() {
  return (
    <div className="grid gap-16 pb-8 md:gap-20">
      <section className="relative overflow-hidden rounded-[30px] border border-slate-800 bg-[#070a0f] px-6 py-14 text-white shadow-[0_40px_120px_rgba(2,6,23,.18)] sm:px-10 sm:py-18 lg:px-12 lg:py-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(circle at 78% 8%, rgba(122,167,255,.12), transparent 30%), radial-gradient(circle at 20% 100%, rgba(110,231,183,.08), transparent 26%)',
          }}
        />
        <div className="relative max-w-4xl">
          <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/70">
            AI Efficiency Intelligence
          </p>
          <h1 className="mt-5 text-[clamp(3.4rem,8vw,7.2rem)] font-semibold leading-[.88] tracking-[-.075em] text-white">
            Find AI waste.
            <span className="block text-white/68">Prove the fix.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
            Connect OpenAI or Anthropic, or upload a usage CSV. Evalomics
            analyzes the evidence automatically and gives you the strongest
            cost-saving action it can support.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 no-underline transition hover:-translate-y-0.5 hover:bg-emerald-100"
              style={{ color: '#0b1017' }}
            >
              Analyze my AI usage <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/login?returnTo=/start"
              className="inline-flex min-h-12 items-center rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white no-underline transition hover:bg-white/[0.08]"
              style={{ color: '#ffffff' }}
            >
              Try the live demo
            </Link>
          </div>

          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-white/66">
            {[
              'Free during beta',
              'No credit card',
              'No prompt content required for supported aggregate-data paths',
              'No invented savings',
            ].map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5">
                <CheckCircle2
                  className="size-3 text-emerald-200/70"
                  aria-hidden="true"
                />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="evidence-engine-title">
        <div className="mb-7 grid gap-4 lg:grid-cols-[.82fr_1.18fr] lg:items-end">
          <div>
            <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
              See Evalomics think
            </p>
            <h2
              id="evidence-engine-title"
              className="mt-4 max-w-[11ch] text-[clamp(2.7rem,5vw,5rem)] font-semibold leading-[.94] tracking-[-.06em] text-slate-950"
            >
              Evidence in. One answer out.
            </h2>
          </div>
          <p className="m-0 max-w-2xl text-base leading-7 text-slate-600 lg:justify-self-end">
            Evalomics does not dump another dashboard on you. It normalizes the
            source, filters unsupported guesses, and surfaces the strongest
            action your current evidence can justify.
          </p>
        </div>
        <EvidenceEngineDemo />
      </section>

      <section className="grid gap-7 rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_24px_70px_rgba(15,23,42,.05)] sm:p-10 lg:grid-cols-[.95fr_1.05fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
            <ShieldCheck className="size-3.5" />
            Product contract
          </div>
          <h2 className="mt-4 max-w-[11ch] text-[clamp(2.45rem,5vw,4.5rem)] font-semibold leading-[.95] tracking-[-.055em] text-slate-950">
            No evidence, no claim.
          </h2>
        </div>
        <div>
          <p className="m-0 text-sm leading-6 text-slate-600">
            Opportunity, Tested, and Verified are different states. Evalomics
            only upgrades the label when stronger evidence exists, so modeled
            savings never masquerade as achieved savings.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white no-underline"
              style={{ color: '#ffffff' }}
            >
              Analyze my AI usage <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/methodology"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-950 no-underline"
            >
              Read the methodology
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
