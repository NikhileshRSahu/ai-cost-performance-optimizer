import { BookOpen, Copy, Scissors, Shapes, Sparkles } from 'lucide-react';

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

export default function PromptOptimizerPage() {
  return (
    <div className="space-y-7">
      <section>
        <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
          Prompt cost engineering
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-100 sm:text-3xl">
          Make every token earn its keep.
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          A compact library of general optimization patterns. These are not
          personalized claims unless Evalomics has prompt-level evidence.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {tips.map(({ icon: Icon, category, title, before, after, note }) => (
          <article
            key={title}
            className="rounded-xl border border-white/[0.07] bg-[linear-gradient(145deg,rgba(15,23,33,.96),rgba(8,12,17,.98))] p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-2.5 py-1 text-[10px] font-semibold text-cyan-100">
                  <Icon className="size-3.5" />
                  {category}
                </span>
                <h2 className="mt-4 text-base font-medium text-slate-100">
                  {title}
                </h2>
              </div>
              <Sparkles className="size-4 text-cyan-300/60" />
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
        <BookOpen className="mr-2 inline size-3.5 text-cyan-300/70" />
        Personalized prompt optimization requires sanitized prompt/history
        evidence. Evalomics will not pretend aggregate usage can reveal prompt
        structure.
      </div>
    </div>
  );
}
