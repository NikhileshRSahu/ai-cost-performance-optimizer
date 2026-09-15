import { Braces, FileCheck2, LockKeyhole, ShieldCheck } from 'lucide-react';

const boundaries = [
  {
    icon: Braces,
    title: 'Potential',
    body: 'A bounded opportunity supported by current evidence. It is not counted as savings.',
  },
  {
    icon: FileCheck2,
    title: 'Tested',
    body: 'A controlled benchmark cleared the configured quality and performance guardrails.',
  },
  {
    icon: ShieldCheck,
    title: 'Verified',
    body: 'Comparable post-change production evidence confirms the net impact after implementation.',
  },
];

export function EvidenceBoundary() {
  return (
    <section className="my-24 overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950 px-5 py-12 text-white sm:px-8 md:my-32 md:px-12 md:py-16">
      <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:items-start">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-300/70">
            <LockKeyhole className="size-3.5" />
            Evidence before claims
          </div>
          <h2 className="mt-4 !text-[clamp(2.5rem,5vw,4.7rem)] !leading-[.95] !tracking-[-.055em] text-white">
            Every number has a state.
          </h2>
          <p className="mt-6 max-w-md text-sm leading-6 text-white/42">
            The trust boundary is part of the product, not fine print. Evalomics
            withholds conclusions the evidence cannot support.
          </p>
        </div>

        <div className="grid gap-2.5">
          {boundaries.map(({ icon: Icon, title, body }) => (
            <article
              key={title}
              className="grid gap-3 rounded-2xl border border-white/[0.085] bg-white/[0.035] p-4 sm:grid-cols-[36px_100px_1fr] sm:items-center"
            >
              <div className="grid size-9 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/55">
                <Icon className="size-4" />
              </div>
              <strong className="text-sm font-semibold text-white/85">
                {title}
              </strong>
              <p className="m-0 text-xs leading-5 text-white/38">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
