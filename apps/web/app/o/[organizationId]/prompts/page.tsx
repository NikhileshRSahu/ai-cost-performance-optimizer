import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpen, Copy, Scissors, Shapes, Sparkles } from 'lucide-react';

const tips = [
  {
    icon: Scissors,
    category: 'Context pruning',
    title: 'Send only the context the task needs',
    before: 'Full conversation + entire knowledge base + every metadata field',
    after: 'Top relevant passages + only the metadata used by the task',
    note: 'General pattern. Not inferred from your private prompts.',
  },
  {
    icon: Shapes,
    category: 'Structured output',
    title: 'Replace repeated prose instructions with a schema',
    before: 'Long paragraph explaining every field and response shape',
    after: 'Return JSON with the required fields and concise constraints',
    note: 'Useful when the downstream consumer expects a stable shape.',
  },
  {
    icon: Copy,
    category: 'Caching',
    title: 'Keep stable prompt prefixes byte-for-byte stable',
    before: 'Repeated system context changes slightly on every request',
    after: 'Stable cached prefix + request-specific tail',
    note: 'Only useful when the provider and workload support caching.',
  },
] as const;

export default async function PromptOptimizerPage({
  params,
}: Readonly<{ params: Promise<{ organizationId: string }> }>) {
  const { organizationId } = await params;
  return (
    <div className="space-y-7">
      <section>
        <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-300">
          Evalomics evaluation tool · prompt
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-100 sm:text-3xl">
          Improve the prompt only when the evidence points here.
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          This page supports the main optimization story. Use these patterns when
          Evalomics identifies prompt or context waste; the recommendation remains
          the source of truth for what should be changed first.
        </p>
      </section>

      <section className="rounded-[22px] border border-sky-300/12 bg-sky-300/[0.035] p-5 sm:p-6">
        <p className="m-0 font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-sky-200/65">
          Where this fits
        </p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="m-0 text-lg font-semibold text-white">
              Found → evaluate prompt change → return to the recommendation
            </h2>
            <p className="m-0 mt-2 max-w-2xl text-sm leading-6 text-white/45">
              Do not optimize prompts just because you can. Start from the supported
              finding, use this tool to shape the candidate, then let Evalomics
              evaluate the result against the workload requirements.
            </p>
          </div>
          <Link
            href={'/o/' + organizationId + '/recommendations'}
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-slate-950 no-underline"
          >
            Back to next action <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {tips.map(({ icon: Icon, category, title, before, after, note }) => (
          <article
            key={title}
            className="rounded-xl border border-white/[0.07] bg-[#111a29] p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-violet-300/15 bg-violet-400/[0.08] px-2.5 py-1 text-[10px] font-semibold text-violet-200">
                  <Icon className="size-3.5" />
                  {category}
                </span>
                <h2 className="mt-4 text-base font-medium text-slate-100">
                  {title}
                </h2>
              </div>
              <Sparkles className="size-4 text-violet-300/60" />
            </div>

            <div className="mt-5 grid gap-3">
              <div className="rounded-lg border border-rose-400/10 bg-rose-400/[0.03] p-3">
                <p className="mb-2 text-[10px] uppercase tracking-[0.14em] text-rose-300/70">
                  Before
                </p>
                <p className="font-mono text-xs leading-5 text-slate-400">
                  {before}
                </p>
              </div>
              <div className="rounded-lg border border-emerald-400/10 bg-emerald-400/[0.03] p-3">
                <p className="mb-2 text-[10px] uppercase tracking-[0.14em] text-emerald-300/70">
                  After
                </p>
                <p className="font-mono text-xs leading-5 text-slate-300">
                  {after}
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">{note}</p>
          </article>
        ))}
      </section>

      <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 text-xs leading-5 text-slate-500">
        <BookOpen className="mr-2 inline size-3.5 text-violet-300/70" />
        When prompt-level evidence is unavailable, these remain general engineering
        patterns. Evalomics AI can explain whether your current recommendation
        actually requires prompt evidence before you change anything.
      </div>

      <Link
        href={'/o/' + organizationId}
        className="inline-flex items-center gap-2 text-xs font-semibold text-white/45 no-underline hover:text-white"
      >
        <ArrowLeft className="size-3.5" /> Return to your result
      </Link>
    </div>
  );
}
