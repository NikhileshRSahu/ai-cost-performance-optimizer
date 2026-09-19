import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms | Evalomics',
  description: 'Usage boundaries for the Evalomics free launch beta.',
};

export default function TermsPage() {
  return (
    <div className="landing-stack legal-page">
      <section className="hero hero-wide">
        <p className="eyebrow">Launch beta terms</p>
        <h1>A decision-support tool, not an automatic production operator.</h1>
        <p className="lede">
          Evalomics helps customers analyze AI evidence, test bounded
          optimization hypotheses, generate implementation guidance, and measure
          post-change impact.
        </p>
        <div className="evidence-note">
          <strong>Beta transparency:</strong> these terms describe the current
          product boundaries for the free launch beta. They may be updated as
          Evalomics moves toward general availability.
        </div>
      </section>

      <section className="legal-sections" aria-label="Launch beta terms">
        <article>
          <h2>Customer responsibility</h2>
          <p>
            Customers must have the right to upload the evidence they provide or
            connect the provider organization they authorize. They are
            responsible for reviewing any generated implementation package
            before changing production systems.
          </p>
        </article>
        <article>
          <h2>No automatic production changes</h2>
          <p>
            The free launch beta does not automatically mutate production model,
            prompt, routing, infrastructure, or provider configuration.
          </p>
        </article>
        <article>
          <h2>No guaranteed savings</h2>
          <p>
            Opportunity estimates and benchmark results are not guaranteed
            savings. A result becomes verified only after comparable post-change
            evidence satisfies the product&apos;s verification rules.
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
          <h2>Launch beta scope</h2>
          <p>
            The launch beta supports usage CSV analysis and optional OpenAI or
            Anthropic organization-usage connections through customer-authorized
            Admin API keys. Broader workspace connectors and automatic
            production mutation are not included unless separately released and
            explicitly authorized.
          </p>
        </article>
        <article>
          <h2>Launch beta access</h2>
          <p>
            The current Evalomics launch beta is free and does not require a
            credit card or subscription. Paid plans or services, if introduced
            later, will be presented separately with clear terms before any
            charge or commitment.
          </p>
        </article>
        <article>
          <h2>Availability</h2>
          <p>
            This is a free public beta product. Features may evolve, and
            Evalomics should not be represented as generally available
            enterprise infrastructure until its release gates are closed.
          </p>
        </article>
        <article>
          <h2>Prohibited use</h2>
          <p>
            Do not use the product to upload evidence or connect organizations
            you are not authorized to process, evade provider or organizational
            access controls, or misrepresent synthetic, modeled, or benchmarked
            output as verified customer evidence.
          </p>
        </article>
      </section>
    </div>
  );
}
