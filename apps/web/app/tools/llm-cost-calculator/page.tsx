import type { Metadata } from 'next';
import Link from 'next/link';
import { LlmCostCalculator } from '../../../components/llm-cost-calculator';

export const metadata: Metadata = {
  title: 'Free LLM Cost Calculator | Evalomics',
  description:
    'Estimate monthly LLM cost from request volume, token usage, and your own input/output token prices. No provider credentials required.',
};

export default function LlmCostCalculatorPage() {
  return (
    <div className="landing-stack">
      <section className="hero hero-wide" aria-labelledby="calculator-title">
        <p className="eyebrow">Free tool · no login required</p>
        <h1 id="calculator-title">LLM Cost Calculator</h1>
        <p className="lede">
          Estimate monthly inference cost from request volume, average token
          usage, and the rates you actually pay. Choose the currency those rates
          are already denominated in; this tool never performs hidden FX
          conversion.
        </p>
      </section>

      <LlmCostCalculator />

      <section className="landing-grid" aria-labelledby="next-title">
        <div>
          <p className="eyebrow">The calculator answers “how much?”</p>
          <h2 id="next-title">The Work MRI answers “what should I change?”</h2>
        </div>
        <div>
          <p className="lede">
            Cost visibility is only the first step. Evalomics diagnoses
            supported inefficiencies, proposes bounded changes, tests them
            against a quality floor, and keeps potential, tested, and verified
            savings separate.
          </p>
          <div className="hero-actions">
            <Link className="primary-action" href="/pricing">
              Continue to the Work MRI
            </Link>
            <Link href="/methodology">See the methodology</Link>
          </div>
        </div>
      </section>

      <section className="evidence-note">
        <strong>Calculation boundary:</strong> this tool estimates inference
        cost only from the values you enter. It does not include tool calls,
        vector databases, infrastructure, taxes, discounts, caching rules, or
        provider-specific billing behavior unless you incorporate those effects
        into your entered rates and token averages.
      </section>
    </div>
  );
}
