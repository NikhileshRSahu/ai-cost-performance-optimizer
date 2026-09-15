import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms | Evalomics',
  description:
    'Prelaunch terms and usage boundaries for the Evalomics CSV-first pilot.',
};

export default function TermsPage() {
  return (
    <div className="landing-stack legal-page">
      <section className="hero hero-wide">
        <p className="eyebrow">Prelaunch pilot terms</p>
        <h1>A decision-support tool, not an automatic production operator.</h1>
        <p className="lede">
          Evalomics helps customers analyze AI evidence, test bounded
          optimization hypotheses, generate implementation guidance, and measure
          post-change impact.
        </p>
        <div className="evidence-note">
          <strong>Legal-review status:</strong> these pilot terms document the
          intended product and commercial boundaries. Final enforceable terms
          require launch-jurisdiction review before general availability.
        </div>
      </section>

      <section className="legal-sections" aria-label="Pilot terms">
        <article>
          <h2>Customer responsibility</h2>
          <p>
            Customers must have the right to upload the evidence they provide
            and are responsible for reviewing any generated implementation
            package before changing production systems.
          </p>
        </article>
        <article>
          <h2>No automatic production changes</h2>
          <p>
            The CSV-first pilot does not automatically mutate production model,
            prompt, routing, infrastructure, or provider configuration.
          </p>
        </article>
        <article>
          <h2>No guaranteed savings</h2>
          <p>
            Opportunity estimates and benchmark results are not guaranteed
            savings. A result becomes verified only after comparable post-change
            evidence satisfies the product's verification rules.
          </p>
        </article>
        <article>
          <h2>Performance constraints</h2>
          <p>
            A cheaper candidate is not recommended simply because it costs less.
            Customers define quality, latency, failure-rate, and other
            applicable constraints for the workload being tested.
          </p>
        </article>
        <article>
          <h2>Pilot scope</h2>
          <p>
            The launch mode is CSV-first. Gated workspace connectors,
            provider-admin credentials, and automatic production mutation are
            not included unless separately released and explicitly authorized.
          </p>
        </article>
        <article>
          <h2>Pricing and scoped services</h2>
          <p>
            Public pilot pricing describes the current service scope. A
            fixed-price Optimization Audit and any larger implementation sprint
            remain subject to the scope shown before invoicing or acceptance.
          </p>
        </article>
        <article>
          <h2>Availability</h2>
          <p>
            This is a public beta / founding-pilot product. Features may evolve,
            and Evalomics should not be represented as generally available
            enterprise infrastructure until its release gates are closed.
          </p>
        </article>
        <article>
          <h2>Prohibited use</h2>
          <p>
            Do not use the product to upload evidence you are not authorized to
            process, evade provider or organizational access controls, or
            misrepresent synthetic, projected, or benchmarked output as verified
            customer evidence.
          </p>
        </article>
      </section>
    </div>
  );
}
