import type { Metadata } from 'next';
import Link from 'next/link';
import { PromptCacheSavingsCalculator } from '../../../components/prompt-cache-savings-calculator';

export const metadata: Metadata = {
  title: 'Prompt Cache Savings Calculator | Evalomics',
  description:
    'Estimate potential input-token savings from your cache hit rate and the cached versus uncached rates you actually pay.',
};

export default function Page() {
  return (
    <div className="landing-stack">
      <section className="hero hero-wide">
        <p className="eyebrow">Free tool · no login required</p>
        <h1>Prompt Cache Savings Calculator</h1>
        <p className="lede">
          Estimate potential input-token savings from your cache hit rate and
          the cached versus uncached rates you actually pay.
        </p>
      </section>

      <PromptCacheSavingsCalculator />

      <section className="evidence-note">
        <strong>Calculation boundary:</strong> this isolates the cacheable
        input-token portion you enter. It does not include output tokens, cache
        write fees, minimum cache durations, provider eligibility rules, taxes,
        or other infrastructure.
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
