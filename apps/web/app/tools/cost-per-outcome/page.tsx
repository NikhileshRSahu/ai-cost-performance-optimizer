import type { Metadata } from 'next';
import Link from 'next/link';
import { CostPerOutcomeCalculator } from '../../../components/cost-per-outcome-calculator';

export const metadata: Metadata = {
  title: 'Cost per Successful Outcome Calculator | Evalomics',
  description:
    'Estimate the economic cost of a successful AI outcome from monthly cost, request volume, and your measured success rate.',
};

export default function Page() {
  return (
    <div className="landing-stack">
      <section className="hero hero-wide">
        <p className="eyebrow">Free tool · no login required</p>
        <h1>Cost per Successful Outcome Calculator</h1>
        <p className="lede">
          Estimate the economic cost of a successful AI outcome from monthly
          cost, request volume, and your measured success rate.
        </p>
      </section>

      <CostPerOutcomeCalculator />

      <section className="evidence-note">
        <strong>Calculation boundary:</strong> the unsuccessful-request spend
        assumes cost is distributed evenly across requests. It is a diagnostic
        estimate, not a verified waste claim.
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
