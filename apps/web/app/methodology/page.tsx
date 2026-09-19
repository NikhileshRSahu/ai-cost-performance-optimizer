import {
  ArrowRight,
  CheckCircle2,
  FlaskConical,
  Gauge,
  SearchCheck,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';

const stages = [
  {
    step: '01 · OBSERVE',
    title: 'Record what actually happened',
    body: 'Normalize provider, model, request volume, measured cost, token classes, latency, cache, retries, outcomes, and provenance when those fields exist.',
    icon: SearchCheck,
  },
  {
    step: '02 · DETECT',
    title: 'Only diagnose supported inefficiency',
    body: 'Missing denominators, mixed currencies, incomplete retry evidence, and unsupported fields produce withheld claims instead of guesses.',
    icon: Gauge,
  },
  {
    step: '03 · TEST',
    title: 'Make the quality floor explicit',
    body: 'A cheaper configuration is not recommended merely because it costs less. Candidate changes must be benchmarked against declared performance constraints.',
    icon: FlaskConical,
  },
  {
    step: '04 · VERIFY',
    title: 'Measure the post-change result',
    body: 'Potential, tested, and verified states remain separate. Negative verified impact remains visible and rollback guidance is retained.',
    icon: ShieldCheck,
  },
] as const;

export default function MethodologyPage() {
  return (
    <main className="eval-glass-panel relative mx-auto max-w-6xl overflow-hidden rounded-[28px] px-6 py-8 text-white sm:px-8 sm:py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_10%,rgba(99,222,244,.08),transparent_28%),radial-gradient(circle_at_15%_80%,rgba(240,163,91,.08),transparent_30%)]" />
      <section className="relative max-w-4xl pt-4 sm:pt-8">
        <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300/75">
          Methodology
        </p>
        <h1 className="mt-4 text-[clamp(3rem,7vw,6.5rem)] font-semibold leading-[.9] tracking-[-.07em] text-white">
          Every recommendation should survive an evidence audit.
        </h1>
        <p className="mt-6 max-w-3xl text-base leading-7 text-white/45">
          Evalomics separates observation, diagnosis, benchmark evidence,
          implementation, and production verification so an attractive estimate
          cannot quietly become a customer-savings claim.
        </p>
      </section>

      <section
        className="relative mt-12 grid gap-4 md:grid-cols-2"
        aria-label="Decision methodology"
      >
        {stages.map(({ step, title, body, icon: Icon }) => (
          <article key={step} className="eval-glass-card rounded-[20px] p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-cyan-300/65">
                {step}
              </span>
              <span className="grid size-9 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/55">
                <Icon className="size-4" />
              </span>
            </div>
            <h2 className="mt-7 text-xl font-semibold tracking-[-0.035em] text-white">
              {title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/42">{body}</p>
          </article>
        ))}
      </section>

      <section className="eval-glass-card relative mt-14 rounded-[24px] p-6 sm:p-8">
        <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
          Claim taxonomy
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-white">
          Potential ≠ Tested ≠ Verified.
        </h2>
        <div className="mt-7 grid gap-3 md:grid-cols-3">
          {[
            [
              'Potential',
              'A bounded opportunity derived from available evidence. Not savings.',
              'text-[var(--eval-opportunity)]',
            ],
            [
              'Tested',
              'A candidate that passed the declared benchmark constraints. Still not production savings.',
              'text-[var(--eval-tested)]',
            ],
            [
              'Verified',
              'Comparable post-change production evidence supports the recorded net impact.',
              'text-[var(--eval-verified)]',
            ],
          ].map(([label, body, tone]) => (
            <div
              key={label}
              className="rounded-2xl border border-white/[0.07] bg-black/20 p-4"
            >
              <strong className={'text-sm ' + tone}>{label}</strong>
              <p className="mt-2 text-xs leading-5 text-white/38">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative mt-6 flex flex-col gap-4 rounded-[20px] border border-emerald-300/14 bg-emerald-300/[0.04] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-200" />
          <p className="m-0 max-w-3xl text-sm leading-6 text-white/55">
            Synthetic, projected, historical replay, research, or inferred
            savings cannot be labeled as verified customer savings.
          </p>
        </div>
        <Link
          href="/start?intent=analyze"
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-[#071018] no-underline"
        >
          Analyze usage <ArrowRight className="size-3.5" />
        </Link>
      </section>
    </main>
  );
}
