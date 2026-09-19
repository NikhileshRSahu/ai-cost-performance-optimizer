import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Bot, Calculator, Gauge, Layers3 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Free AI Cost & Efficiency Tools | Evalomics',
  description:
    'Free calculators for LLM cost, AI agent cost, cost per successful outcome, and prompt caching savings.',
};

const toolItems = [
  {
    href: '/tools/llm-cost-calculator',
    label: 'LLM Cost',
    description:
      'Monthly inference cost from your request volume, token usage, and rates.',
    icon: Calculator,
  },
  {
    href: '/tools/cost-per-outcome',
    label: 'Cost / outcome',
    description:
      'How reliability changes the real cost of one successful AI outcome.',
    icon: Gauge,
  },
  {
    href: '/tools/prompt-cache-savings',
    label: 'Prompt cache',
    description:
      'Bounded cache savings from cacheable input and your own token rates.',
    icon: Layers3,
  },
  {
    href: '/tools/ai-agent-cost',
    label: 'Agent cost',
    description:
      'Model and tool cost per agent run, per month, and annualized.',
    icon: Bot,
  },
] as const;

export default function ToolsPage() {
  return (
    <div className="grid gap-14 rounded-[28px] bg-[#090806] px-5 pb-12 sm:px-7">
      <section className="max-w-4xl pt-6 sm:pt-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-100">
          Free tools · no login
        </p>
        <h1 className="mt-4 !text-[clamp(3.2rem,7vw,6.6rem)] !leading-[.9] !tracking-[-.07em] text-white">
          Measure one thing
          <span className="block text-white/70">before you optimize it.</span>
        </h1>
        <p className="mt-7 max-w-2xl text-base leading-7 text-white/70">
          These are small exact-arithmetic tools, not the main product. They
          help you understand one economic question before the Work MRI
          diagnoses what is actually worth changing.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {toolItems.map(({ href, label, description, icon: Icon }, index) => (
          <Link
            key={href}
            href={href}
            className="eval-glass-card group min-h-52 rounded-[22px] p-6 no-underline sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-white/55 transition group-hover:border-orange-200/20 group-hover:text-white">
                <Icon className="size-4.5" />
              </div>
              <span className="font-mono text-[10px] font-semibold text-white/30">
                0{index + 1}
              </span>
            </div>
            <h2 className="mt-12 text-xl font-semibold tracking-[-0.03em] text-white">
              {label}
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-white/70">
              {description}
            </p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-orange-100">
              Open tool{' '}
              <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </section>

      <section className="eval-glass-panel grid gap-6 rounded-[24px] p-6 text-white sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-200/90">
            From calculator to diagnosis
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-white sm:text-3xl">
            Know the cost? Now find the waste.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
            The Work MRI ranks evidence-backed inefficiencies and tells you
            which bounded change is worth benchmarking next.
          </p>
        </div>
        <Link
          href="/start?intent=analyze"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 no-underline transition hover:bg-emerald-100"
          style={{ color: '#0b1017' }}
        >
          Run the free Work MRI <ArrowRight className="size-4" />
        </Link>
      </section>
    </div>
  );
}
