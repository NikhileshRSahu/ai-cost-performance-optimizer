import type { Metadata } from 'next';
import Link from 'next/link';
import { AiAgentCostCalculator } from '../../../components/ai-agent-cost-calculator';

export const metadata: Metadata = {
  title: 'AI Agent Cost Calculator | Evalomics',
  description:
    'Estimate the monthly and per-run cost of an AI agent from model calls, token usage, provider rates, and other tool cost.',
};

export default function Page() {
  return (
    <div className="landing-stack">
      <section className="hero hero-wide">
        <p className="eyebrow">Free tool · no login required</p>
        <h1>AI Agent Cost Calculator</h1>
        <p className="lede">
          Estimate the monthly and per-run cost of an AI agent from model calls,
          token usage, provider rates, and other tool cost.
        </p>
      </section>

      <AiAgentCostCalculator />

      <section className="evidence-note">
        <strong>Calculation boundary:</strong> this is a workload estimate from
        the assumptions you enter. It excludes unentered infrastructure,
        retries, storage, orchestration, taxes, discounts, and provider-specific
        billing behavior.
      </section>

      <div className="hero-actions">
        <Link className="primary-action" href="/login">
          Run the free Work MRI
        </Link>
        <Link href="/tools">Explore all free tools</Link>
      </div>
    </div>
  );
}
