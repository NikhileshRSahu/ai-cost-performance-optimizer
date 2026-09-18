import Link from 'next/link';
import { ArrowRight, Calculator, Coins, DatabaseZap } from 'lucide-react';

export default function ModelCalculatorPage() {
  const tools = [
    {
      icon: Calculator,
      title: 'LLM Cost Calculator',
      body: 'Compare model input/output pricing for a workload before you switch.',
      href: '/tools/llm-cost-calculator',
    },
    {
      icon: DatabaseZap,
      title: 'Prompt Cache Savings',
      body: 'Estimate the upside from eligible repeated input without calling it verified.',
      href: '/tools/prompt-cache-savings',
    },
    {
      icon: Coins,
      title: 'Cost per outcome',
      body: 'Model the cost of successful outcomes rather than raw request volume alone.',
      href: '/tools/cost-per-outcome',
    },
  ] as const;

  return (
    <div className="space-y-7">
      <section>
        <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">
          What-if planning
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-100 sm:text-3xl">
          Model the next cost decision.
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          Use the free calculators for planning. Results are scenarios, not
          verified production savings.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {tools.map(({ icon: Icon, title, body, href }) => (
          <article
            key={title}
            className="flex min-h-64 flex-col rounded-xl border border-white/[0.07] bg-[#111a29] p-5"
          >
            <span className="grid size-10 place-items-center rounded-xl border border-amber-300/15 bg-amber-400/[0.06]">
              <Icon className="size-4 text-amber-200" />
            </span>
            <h2 className="mt-6 text-base font-medium text-slate-100">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{body}</p>
            <Link
              href={href}
              className="mt-auto inline-flex items-center gap-2 pt-6 text-xs font-semibold text-sky-300 no-underline"
            >
              Open calculator <ArrowRight className="size-3.5" />
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}
