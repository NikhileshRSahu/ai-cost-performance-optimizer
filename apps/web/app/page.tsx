import Link from 'next/link';
import {
  ArrowRight,
  DatabaseZap,
  FlaskConical,
  ScanSearch,
  ShieldCheck,
} from 'lucide-react';
import { EvidenceBoundary } from '../components/home/evidence-boundary';
import { ProofScrollStory } from '../components/home/proof-scroll-story';
import { WorkMriHero } from '../components/home/work-mri-hero';

const capabilities = [
  {
    icon: DatabaseZap,
    eyebrow: 'Evidence',
    title: 'Start without handing over your prompts.',
    body: 'Upload usage CSVs or authorize supported provider data. Evalomics keeps provider-reported cost and usage evidence explicit instead of reconstructing numbers it does not have.',
  },
  {
    icon: ScanSearch,
    eyebrow: 'Diagnosis',
    title: 'Turn usage into a ranked waste map.',
    body: 'Work MRI measures what the current evidence can support and makes missing context visible rather than hiding it behind a confidence score.',
  },
  {
    icon: FlaskConical,
    eyebrow: 'Benchmark',
    title: 'Test the change before production.',
    body: 'Compare a bounded candidate against explicit quality, latency, failure-rate, and economics constraints before recommending implementation.',
  },
  {
    icon: ShieldCheck,
    eyebrow: 'Verification',
    title: 'Make verified savings hard to fake.',
    body: 'Only comparable post-change evidence can advance a recommendation to Verified. Failed or neutral outcomes remain visible.',
  },
] as const;

export default function HomePage() {
  return (
    <div>
      <WorkMriHero />

      <section className="grid gap-8 py-24 md:py-32 lg:grid-cols-[.72fr_1.28fr] lg:gap-16">
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            An operating system for AI efficiency
          </p>
          <h2 className="mt-4 !text-[clamp(2.7rem,5vw,5.2rem)] !leading-[.96] !tracking-[-.06em] text-slate-950">
            A dashboard tells you what happened.
            <span className="block text-slate-400">Evalomics tells you what to test next.</span>
          </h2>
          <p className="mt-6 max-w-lg text-base leading-7 text-slate-500">
            The product connects economics to an evidence trail: observe,
            diagnose, benchmark, implement, then verify. Each stage preserves
            the difference between an opportunity and a result.
          </p>
          <Link
            href="/methodology"
            className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 no-underline"
          >
            Inspect the methodology <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {capabilities.map(({ icon: Icon, eyebrow, title, body }) => (
            <article
              key={title}
              className="group min-h-64 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,.045)] transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_24px_60px_rgba(15,23,42,.075)]"
            >
              <div className="flex items-center justify-between">
                <div className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition group-hover:border-slate-300 group-hover:text-slate-950">
                  <Icon className="size-4.5" />
                </div>
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  {eyebrow}
                </span>
              </div>
              <h3 className="mt-14 text-xl font-semibold leading-6 tracking-[-0.025em] text-slate-950">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-500">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <ProofScrollStory />
      <EvidenceBoundary />

      <section className="mb-12 grid overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,.06)] lg:grid-cols-[1.15fr_.85fr]">
        <div className="p-7 sm:p-10 lg:p-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Start with evidence you already own
          </p>
          <h2 className="mt-4 max-w-3xl !text-[clamp(2.5rem,5vw,4.8rem)] !leading-[.96] !tracking-[-.06em] text-slate-950">
            See what your AI workload is actually costing you.
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-500">
            Begin with a CSV. Connect OpenAI or Anthropic only when deeper
            evidence is worth the additional access. No provider key is needed
            to understand the product.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white no-underline transition hover:bg-slate-800"
              href="/login"
            >
              Run the free Work MRI <ArrowRight className="size-4" />
            </Link>
            <Link
              className="inline-flex min-h-12 items-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 no-underline transition hover:bg-slate-50"
              href="/tools"
            >
              Explore free calculators
            </Link>
          </div>
        </div>
        <div className="grid content-center gap-3 border-t border-slate-200 bg-slate-950 p-7 text-white sm:p-10 lg:border-l lg:border-t-0">
          {[
            ['01', 'Usage evidence', 'Cost, model, token, cache, retry and outcome economics.'],
            ['02', 'Sanitized AI history', 'Repeated context and recurring workflow patterns without requiring raw history by default.'],
            ['03', 'Authorized workspace', 'Cross-tool waste only after explicit connector authorization.'],
            ['04', 'Production telemetry', 'Continuous verification, drift and cost per successful outcome.'],
          ].map(([index, title, detail]) => (
            <div
              key={title}
              className="grid grid-cols-[30px_1fr] gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4"
            >
              <span className="font-mono text-[10px] font-semibold text-blue-300/65">{index}</span>
              <div>
                <strong className="text-sm font-semibold text-white/85">{title}</strong>
                <p className="m-0 mt-1 text-xs leading-5 text-white/35">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
