import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Free AI Cost & Efficiency Tools | Evalomics',
  description:
    'Free calculators for LLM cost, AI agent cost, cost per successful outcome, and prompt caching savings.',
};

const tools = [
  {
    href: '/tools/llm-cost-calculator',
    label: 'LLM Cost Calculator',
    description:
      'Estimate monthly inference cost from request volume, token usage, and the rates you actually pay.',
  },
  {
    href: '/tools/cost-per-outcome',
    label: 'Cost per Successful Outcome',
    description:
      'See how success rate changes the economic cost of a useful AI outcome.',
  },
  {
    href: '/tools/prompt-cache-savings',
    label: 'Prompt Cache Savings',
    description:
      'Estimate the bounded saving from cacheable input tokens using your cached and uncached rates.',
  },
  {
    href: '/tools/ai-agent-cost',
    label: 'AI Agent Cost Calculator',
    description:
      'Estimate model-call and other tool cost per agent run, per month, and annualized.',
  },
] as const;

export default function ToolsPage() {
  return (
    <div className="landing-stack">
      <section className="hero hero-wide">
        <p className="eyebrow">Evalomics free tools</p>
        <h1>Make the AI economics visible before you optimize.</h1>
        <p className="lede">
          Use your own rates and workload assumptions. These calculators use
          exact arithmetic and never silently convert currencies or turn an
          estimate into verified savings.
        </p>
      </section>

      <section className="privacy-levels" aria-label="Free calculators">
        {tools.map((tool) => (
          <article key={tool.href}>
            <span>NO LOGIN</span>
            <strong>{tool.label}</strong>
            <p>{tool.description}</p>
            <Link className="text-link" href={tool.href}>
              Open calculator
            </Link>
          </article>
        ))}
      </section>

      <section className="evidence-note">
        <strong>Next step:</strong> calculators answer bounded economic
        questions. The Work MRI uses evidence to diagnose which optimization is
        actually worth testing.
        <div className="hero-actions">
          <Link className="primary-action" href="/login">
            Run the free Work MRI
          </Link>
          <Link href="/methodology">Read the methodology</Link>
        </div>
      </section>
    </div>
  );
}
